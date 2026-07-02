import { and, asc, eq, gt, gte, isNotNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines, offices, blogPosts } from '@/lib/schema'
import { notTrashed } from '@/lib/visibility'

export type EntityType = 'offices' | 'airlines' | 'blog'

export interface MonthPoint {
  label: string // e.g. "Feb"
  offices: number
  airlines: number
  blog: number
  total: number
}

export interface TrendStat {
  last30: number
  prev30: number
  deltaPct: number | null // null when prev30 === 0
}

export interface UpcomingItem {
  type: 'Office' | 'Airline' | 'Blog'
  title: string
  scheduledAt: string
  href: string
}

export interface DashboardData {
  months: MonthPoint[]
  trends: Record<EntityType, TrendStat>
  upcoming: UpcomingItem[]
  publishedTotal: number
}

const MS_DAY = 86_400_000

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

function trend(dates: Date[], now: number): TrendStat {
  const last30 = dates.filter((d) => d.getTime() >= now - 30 * MS_DAY).length
  const prev30 = dates.filter((d) => {
    const t = d.getTime()
    return t < now - 30 * MS_DAY && t >= now - 60 * MS_DAY
  }).length
  const deltaPct = prev30 === 0 ? null : Math.round(((last30 - prev30) / prev30) * 100)
  return { last30, prev30, deltaPct }
}

// Powers the dashboard homepage: a 6-month publication series, 30d-over-30d
// trend deltas per entity, and the next scheduled items. Publication dates are
// bucketed in JS (not via DB date functions) to stay portable across the
// MySQL/MariaDB split this project runs on.
export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now()
  const sixMonthsAgo = new Date(now - 186 * MS_DAY)
  const nowDate = new Date(now)

  const [officePub, airlinePub, blogPub, upOffices, upAirlines, upBlog] = await Promise.all([
    db.select({ publishedAt: offices.publishedAt })
      .from(offices)
      .where(and(isNotNull(offices.publishedAt), gte(offices.publishedAt, sixMonthsAgo), notTrashed(offices))),
    db.select({ publishedAt: airlines.publishedAt })
      .from(airlines)
      .where(and(isNotNull(airlines.publishedAt), gte(airlines.publishedAt, sixMonthsAgo), notTrashed(airlines))),
    db.select({ publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(and(isNotNull(blogPosts.publishedAt), gte(blogPosts.publishedAt, sixMonthsAgo), notTrashed(blogPosts))),

    db.select({ title: offices.fullTitle, slug: offices.slug, scheduledAt: offices.scheduledAt, airlineSlug: airlines.slug })
      .from(offices)
      .innerJoin(airlines, eq(offices.airlineId, airlines.id))
      .where(and(eq(offices.status, 'scheduled'), gt(offices.scheduledAt, nowDate), notTrashed(offices)))
      .orderBy(asc(offices.scheduledAt))
      .limit(6),
    db.select({ title: airlines.name, slug: airlines.slug, scheduledAt: airlines.scheduledAt })
      .from(airlines)
      .where(and(eq(airlines.status, 'scheduled'), gt(airlines.scheduledAt, nowDate), notTrashed(airlines)))
      .orderBy(asc(airlines.scheduledAt))
      .limit(6),
    db.select({ title: blogPosts.title, slug: blogPosts.slug, scheduledAt: blogPosts.scheduledAt })
      .from(blogPosts)
      .where(and(eq(blogPosts.status, 'scheduled'), gt(blogPosts.scheduledAt, nowDate), notTrashed(blogPosts)))
      .orderBy(asc(blogPosts.scheduledAt))
      .limit(6),
  ])

  const officeDates = officePub.map((r) => r.publishedAt!).filter(Boolean)
  const airlineDates = airlinePub.map((r) => r.publishedAt!).filter(Boolean)
  const blogDates = blogPub.map((r) => r.publishedAt!).filter(Boolean)

  // Build the last 6 month buckets in chronological order.
  const buckets = new Map<string, MonthPoint>()
  const order: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1)
    const key = monthKey(d)
    order.push(key)
    buckets.set(key, { label: d.toLocaleDateString('en-US', { month: 'short' }), offices: 0, airlines: 0, blog: 0, total: 0 })
  }

  const bump = (d: Date, field: 'offices' | 'airlines' | 'blog') => {
    const b = buckets.get(monthKey(d))
    if (b) {
      b[field]++
      b.total++
    }
  }
  officeDates.forEach((d) => bump(d, 'offices'))
  airlineDates.forEach((d) => bump(d, 'airlines'))
  blogDates.forEach((d) => bump(d, 'blog'))

  const upcoming: UpcomingItem[] = [
    ...upOffices.map((o) => ({ type: 'Office' as const, title: o.title, scheduledAt: o.scheduledAt!.toISOString(), href: `/admin/offices/${o.airlineSlug}/${o.slug}` })),
    ...upAirlines.map((a) => ({ type: 'Airline' as const, title: a.title, scheduledAt: a.scheduledAt!.toISOString(), href: `/admin/airlines/${a.slug}` })),
    ...upBlog.map((p) => ({ type: 'Blog' as const, title: p.title, scheduledAt: p.scheduledAt!.toISOString(), href: `/admin/blog/${p.slug}` })),
  ]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 6)

  return {
    months: order.map((k) => buckets.get(k)!),
    trends: {
      offices: trend(officeDates, now),
      airlines: trend(airlineDates, now),
      blog: trend(blogDates, now),
    },
    upcoming,
    publishedTotal: officeDates.length + airlineDates.length + blogDates.length,
  }
}
