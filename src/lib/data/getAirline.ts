import { eq, and, gt, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines, offices } from '@/lib/schema'
import { imageUrl } from '@/lib/images'
import { isPubliclyVisible, notTrashed } from '@/lib/visibility'
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
export async function getAllAirlines(): Promise<AirlineIndex[]> {
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
  }))
}

export async function getAirline(slug: string): Promise<Airline | null> {
  const a = await db.query.airlines.findFirst({
    where: and(eq(airlines.slug, slug), isPubliclyVisible(airlines)),
  })
  if (!a) return null

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
