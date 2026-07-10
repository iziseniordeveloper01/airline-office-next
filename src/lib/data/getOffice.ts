import { eq, and, or, gt, inArray, isNull, isNotNull, like, asc, desc, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines, offices, officeFaqs } from '@/lib/schema'
import { imageUrl } from '@/lib/images'
import { isPubliclyVisible, notTrashed } from '@/lib/visibility'
import { cachedRead, CACHE_TAGS } from '@/lib/cache'
import type { Office } from '@/types'

export interface StatusCounts {
  draft: number
  scheduled: number
  published: number
  trashed: number
}

type OfficeRow = typeof offices.$inferSelect

function mapOffice(
  o: OfficeRow,
  airlineSlug: string,
  airlineName: string,
  faqs: { question: string; answer: string }[]
): Office {
  return {
    id: o.id,
    slug: o.slug,
    airlineSlug,
    airlineName,
    fullTitle: o.fullTitle,
    city: o.city,
    country: o.country,
    countryCode: o.countryCode ?? '',
    region: o.region ?? '',
    address: o.address ?? '',
    phone: o.phone ?? '',
    ctaPhone: o.ctaPhone ?? '',
    email: o.email ?? '',
    workingHours: o.workingHours ?? '',
    workingDays: o.workingDays ?? '',
    website: o.website ?? '',
    onlineCheckin: o.onlineCheckin ?? undefined,
    flightStatus: o.flightStatus ?? undefined,
    baggageInfo: o.baggageInfo ?? undefined,
    isHeadquarters: !!o.isHeadquarters,
    mapEmbedUrl: o.mapEmbedUrl ?? undefined,
    mapLat: o.mapLat ? parseFloat(o.mapLat) : undefined,
    mapLng: o.mapLng ? parseFloat(o.mapLng) : undefined,
    heroImage: imageUrl(o.heroImageId),
    ogImage: imageUrl(o.ogImageId),
    faqs,
    content: o.content ?? '',
    socialMedia: {
      facebook: o.facebook ?? undefined,
      twitter: o.twitter ?? undefined,
      instagram: o.instagram ?? undefined,
      youtube: o.youtube ?? undefined,
      linkedin: o.linkedin ?? undefined,
    },
    metaTitle: o.metaTitle ?? '',
    metaDescription: o.metaDescription ?? '',
    canonicalUrl: o.canonicalUrl ?? undefined,
    noindex: !!o.noindex,
    isFeatured: !!o.isFeatured,
    publishedAt: (o.publishedAt ?? o.scheduledAt)?.toISOString() ?? '',
    updatedAt: o.updatedAt?.toISOString() ?? '',
  }
}

async function getFaqsForOffices(officeIds: number[]) {
  if (!officeIds.length) return new Map<number, { question: string; answer: string }[]>()
  const rows = await db.select().from(officeFaqs)
    .where(inArray(officeFaqs.officeId, officeIds))
    .orderBy(asc(officeFaqs.sortOrder))

  const map = new Map<number, { question: string; answer: string }[]>()
  for (const row of rows) {
    const list = map.get(row.officeId) ?? []
    list.push({ question: row.question, answer: row.answer })
    map.set(row.officeId, list)
  }
  return map
}

// Cross-request cached — office detail is the most-visited page type. Keyed by
// (airlineSlug, officeSlug); busted by the office `offices` tag on any save.
export const getOffice = cachedRead(
  readOffice,
  ['office:by-slug'],
  [CACHE_TAGS.offices]
)

async function readOffice(
  airlineSlug: string,
  officeSlug: string
): Promise<Office | null> {
  const airline = await db.query.airlines.findFirst({ where: eq(airlines.slug, airlineSlug) })
  if (!airline) return null

  const office = await db.query.offices.findFirst({
    where: and(eq(offices.airlineId, airline.id), eq(offices.slug, officeSlug), isPubliclyVisible(offices)),
  })
  if (!office) return null

  const faqMap = await getFaqsForOffices([office.id])
  return mapOffice(office, airline.slug, airline.name, faqMap.get(office.id) ?? [])
}

// Admin/draft-preview only — see getAirlineForPreview in getAirline.ts for the
// caching/security rationale (identical here: uncached, notTrashed only).
export async function getOfficeForPreview(
  airlineSlug: string,
  officeSlug: string
): Promise<Office | null> {
  const airline = await db.query.airlines.findFirst({ where: eq(airlines.slug, airlineSlug) })
  if (!airline) return null

  const office = await db.query.offices.findFirst({
    where: and(eq(offices.airlineId, airline.id), eq(offices.slug, officeSlug), notTrashed(offices)),
  })
  if (!office) return null

  const faqMap = await getFaqsForOffices([office.id])
  return mapOffice(office, airline.slug, airline.name, faqMap.get(office.id) ?? [])
}

export const getOfficesByAirline = cachedRead(
  readOfficesByAirline,
  ['offices:by-airline'],
  [CACHE_TAGS.offices]
)

async function readOfficesByAirline(airlineSlug: string): Promise<Office[]> {
  const airline = await db.query.airlines.findFirst({ where: eq(airlines.slug, airlineSlug) })
  if (!airline) return []

  const rows = await db.query.offices.findMany({
    where: and(eq(offices.airlineId, airline.id), isPubliclyVisible(offices)),
  })

  const faqMap = await getFaqsForOffices(rows.map((o) => o.id))
  return rows.map((o) => mapOffice(o, airline.slug, airline.name, faqMap.get(o.id) ?? []))
}

export interface OfficePath {
  airlineSlug: string
  slug: string
  updatedAt: string
  noindex: boolean
}

export const getAllOfficePaths = cachedRead(
  readAllOfficePaths,
  ['offices:all-paths'],
  [CACHE_TAGS.offices]
)

async function readAllOfficePaths(): Promise<OfficePath[]> {
  const rows = await db.select({
    slug: offices.slug,
    updatedAt: offices.updatedAt,
    airlineSlug: airlines.slug,
    noindex: offices.noindex,
  })
    .from(offices)
    .innerJoin(airlines, eq(offices.airlineId, airlines.id))
    .where(isPubliclyVisible(offices))

  return rows.map((o) => ({
    airlineSlug: o.airlineSlug,
    slug: o.slug,
    updatedAt: o.updatedAt?.toISOString() ?? '',
    noindex: !!o.noindex,
  }))
}

// Admin dashboard widget — 4 mutually-exclusive buckets summing to every row.
// "Scheduled" only counts not-yet-due rows; a due-but-unflipped scheduled row
// is already publicly visible, so it counts as "published" here too.
export async function getOfficeStatusCounts(): Promise<StatusCounts> {
  const now = new Date()
  const [[draft], [scheduled], [published], [trashed]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(offices)
      .where(and(eq(offices.status, 'draft'), notTrashed(offices))),
    db.select({ count: sql<number>`count(*)` }).from(offices)
      .where(and(eq(offices.status, 'scheduled'), gt(offices.scheduledAt, now), notTrashed(offices))),
    db.select({ count: sql<number>`count(*)` }).from(offices)
      .where(isPubliclyVisible(offices, now)),
    db.select({ count: sql<number>`count(*)` }).from(offices)
      .where(isNotNull(offices.deletedAt)),
  ])
  return {
    draft: Number(draft.count),
    scheduled: Number(scheduled.count),
    published: Number(published.count),
    trashed: Number(trashed.count),
  }
}

export interface AdminOfficeRow {
  id: number
  slug: string
  airlineSlug: string
  airlineName: string
  fullTitle: string
  city: string
  country: string
  status: 'draft' | 'published' | 'scheduled'
  updatedAt: Date | null
  deletedAt: Date | null
}

export interface AdminOfficesPageParams {
  page?: number
  pageSize?: number
  q?: string
  airlineSlug?: string
  status?: 'draft' | 'published' | 'scheduled' | 'all'
  sort?: 'fullTitle' | 'updatedAt'
  sortDir?: 'asc' | 'desc'
  trashed?: boolean // false (default): the main list. true: the trash view.
}

// Admin-only, server-paginated list query — distinct from the public,
// visibility-filtered functions above. Offices can grow, so this paginates on
// indexed columns (status, deletedAt) rather than loading every row.
export async function getAdminOfficesPage(
  params: AdminOfficesPageParams
): Promise<{ rows: AdminOfficeRow[]; total: number }> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20))
  const sortColumn = params.sort === 'fullTitle' ? offices.fullTitle : offices.updatedAt
  const orderBy = params.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)

  const conditions = [
    params.trashed ? isNotNull(offices.deletedAt) : isNull(offices.deletedAt),
    params.q
      ? or(
          like(offices.fullTitle, `%${params.q}%`),
          like(offices.city, `%${params.q}%`),
          like(offices.country, `%${params.q}%`)
        )
      : undefined,
    params.airlineSlug ? eq(airlines.slug, params.airlineSlug) : undefined,
    params.status && params.status !== 'all' ? eq(offices.status, params.status) : undefined,
  ].filter((c): c is SQL => c !== undefined)

  const where = and(...conditions)

  const [rows, [{ count }]] = await Promise.all([
    db.select({
      id: offices.id,
      slug: offices.slug,
      fullTitle: offices.fullTitle,
      city: offices.city,
      country: offices.country,
      status: offices.status,
      updatedAt: offices.updatedAt,
      deletedAt: offices.deletedAt,
      airlineSlug: airlines.slug,
      airlineName: airlines.name,
    })
      .from(offices)
      .innerJoin(airlines, eq(offices.airlineId, airlines.id))
      .where(where)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` })
      .from(offices)
      .innerJoin(airlines, eq(offices.airlineId, airlines.id))
      .where(where),
  ])

  return { rows, total: Number(count) }
}
