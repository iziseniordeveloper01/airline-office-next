import { cache } from 'react'
import { eq, and, gt, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines, offices } from '@/lib/schema'
import { imageUrl } from '@/lib/images'
import { isPubliclyVisible, notTrashed } from '@/lib/visibility'
import { cachedRead, CACHE_TAGS } from '@/lib/cache'
import type { Airline, AirlineIndex } from '@/types'

export interface StatusCounts {
  draft: number
  scheduled: number
  published: number
  trashed: number
}

// Note: Drizzle's relational `with:` query builder generates LATERAL joins for
// MySQL, which MariaDB (used by many "MySQL" hosts, incl. this project's local
// server) does not support. Plain select()/join() queries avoid that entirely.
// The DB read itself. Throws on failure (never returns []) so the persistent
// cache below never stores an empty result during a build/outage — see cache.ts.
async function readAllAirlines(): Promise<AirlineIndex[]> {
  const [rows, counts] = await Promise.all([
    db.select().from(airlines).where(isPubliclyVisible(airlines)).orderBy(airlines.name),
    db.select({ airlineId: offices.airlineId, count: sql<number>`count(*)` })
      .from(offices)
      .groupBy(offices.airlineId),
  ])

  const countMap = new Map(counts.map((c) => [c.airlineId, Number(c.count)]))

  return rows.map((a) => ({
    slug: a.slug,
    name: a.name,
    iataCode: a.iataCode ?? '',
    logo: imageUrl(a.logoImageId) ?? '',
    isFeatured: !!a.isFeatured,
    officeCount: countMap.get(a.id) ?? 0,
    hqAddress: a.hqAddress ?? '',
    hqPhone: a.hqPhone ?? '',
    hqEmail: a.hqEmail ?? '',
    noindex: !!a.noindex,
  }))
}

// Cross-request cache; office counts move it, so it carries both tags.
const cachedAllAirlines = cachedRead(readAllAirlines, ['airlines:all'], [CACHE_TAGS.airlines, CACHE_TAGS.offices])

// Request-deduped: the homepage hero, PopularAirlines/Headquarters sections and
// the site-layout Footer each read this within a single render.
//
// Build-safe: the (site) layout Footer reads this, and static pages (not-found,
// legal pages) prerender that layout at build time — when Railway's private DB
// host is unreachable. The error fallback lives HERE, outside the cache, so a
// transient failure returns an empty list without being cached.
export const getAllAirlines = cache(async (): Promise<AirlineIndex[]> => {
  try {
    return await cachedAllAirlines()
  } catch (err) {
    console.warn('[getAllAirlines] DB read failed, returning empty list:', (err as Error).message)
    return []
  }
})

function mapAirline(a: typeof airlines.$inferSelect): Airline {
  return {
    slug: a.slug,
    name: a.name,
    iataCode: a.iataCode ?? '',
    icaoCode: a.icaoCode ?? '',
    logo: imageUrl(a.logoImageId) ?? '',
    coverImage: imageUrl(a.coverImageId) ?? undefined,
    description: a.description ?? '',
    website: a.website ?? '',
    email: a.email ?? '',
    phone: a.phone ?? '',
    foundedYear: a.foundedYear ?? 0,
    alliance: a.alliance ?? undefined,
    headquarters: {
      address: a.hqAddress ?? '',
      phone: a.hqPhone ?? '',
      email: a.hqEmail ?? '',
    },
    socialMedia: {
      facebook: a.facebook ?? undefined,
      twitter: a.twitter ?? undefined,
      instagram: a.instagram ?? undefined,
      youtube: a.youtube ?? undefined,
    },
    metaTitle: a.metaTitle ?? '',
    metaDescription: a.metaDescription ?? '',
    ogImage: imageUrl(a.ogImageId) ?? undefined,
    canonicalUrl: a.canonicalUrl ?? undefined,
    noindex: !!a.noindex,
    updatedAt: a.updatedAt?.toISOString() ?? '',
  }
}

export const getAirline = cachedRead(
  readAirline,
  ['airline:by-slug'],
  [CACHE_TAGS.airlines]
)

async function readAirline(slug: string): Promise<Airline | null> {
  const a = await db.query.airlines.findFirst({
    where: and(eq(airlines.slug, slug), isPubliclyVisible(airlines)),
  })
  return a ? mapAirline(a) : null
}

// Admin/draft-preview only — bypasses status filtering (draft + future-scheduled
// are visible), still excludes soft-deleted rows. Never cached: it's session-gated
// and must never populate the public data cache. Callers (the (site) pages) must
// re-verify the requesting session's role themselves — see src/app/api/draft/route.ts.
export async function getAirlineForPreview(slug: string): Promise<Airline | null> {
  const a = await db.query.airlines.findFirst({
    where: and(eq(airlines.slug, slug), notTrashed(airlines)),
  })
  return a ? mapAirline(a) : null
}

// Admin dashboard widget — same 4-bucket shape as getOfficeStatusCounts/getBlogStatusCounts.
export async function getAirlineStatusCounts(): Promise<StatusCounts> {
  const now = new Date()
  const [[draft], [scheduled], [published], [trashed]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(airlines)
      .where(and(eq(airlines.status, 'draft'), notTrashed(airlines))),
    db.select({ count: sql<number>`count(*)` }).from(airlines)
      .where(and(eq(airlines.status, 'scheduled'), gt(airlines.scheduledAt, now), notTrashed(airlines))),
    db.select({ count: sql<number>`count(*)` }).from(airlines)
      .where(isPubliclyVisible(airlines, now)),
    db.select({ count: sql<number>`count(*)` }).from(airlines)
      .where(isNotNull(airlines.deletedAt)),
  ])
  return {
    draft: Number(draft.count),
    scheduled: Number(scheduled.count),
    published: Number(published.count),
    trashed: Number(trashed.count),
  }
}
