import { headers } from 'next/headers'
import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { Activity, BarChart3, Building2, CalendarClock, ListChecks, Newspaper, Plane, Plus } from 'lucide-react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { airlines, offices, blogPosts } from '@/lib/schema'
import { notTrashed } from '@/lib/visibility'
import { getOfficeStatusCounts } from '@/lib/data/getOffice'
import { getAirlineStatusCounts } from '@/lib/data/getAirline'
import { getBlogStatusCounts } from '@/lib/data/getBlog'
import { getDashboardData, type EntityType } from '@/lib/data/getDashboard'
import { getContentHealth } from '@/lib/data/getContentHealth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/admin/StatusBadge'
import StatTile from '@/components/admin/dashboard/StatTile'
import PublicationsChart from '@/components/admin/dashboard/PublicationsChart'
import ContentHealthCard from '@/components/admin/dashboard/ContentHealthCard'

async function getRecentActivity() {
  const [recentOffices, recentAirlines, recentPosts] = await Promise.all([
    db.select({
      slug: offices.slug,
      title: offices.fullTitle,
      status: offices.status,
      updatedAt: offices.updatedAt,
      airlineSlug: airlines.slug,
    })
      .from(offices)
      .innerJoin(airlines, eq(offices.airlineId, airlines.id))
      .where(notTrashed(offices))
      .orderBy(desc(offices.updatedAt))
      .limit(5),
    db.select({ slug: airlines.slug, title: airlines.name, status: airlines.status, updatedAt: airlines.updatedAt })
      .from(airlines)
      .where(notTrashed(airlines))
      .orderBy(desc(airlines.updatedAt))
      .limit(5),
    db.select({ slug: blogPosts.slug, title: blogPosts.title, status: blogPosts.status, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(notTrashed(blogPosts))
      .orderBy(desc(blogPosts.updatedAt))
      .limit(5),
  ])

  const merged = [
    ...recentOffices.map((o) => ({ type: 'Office' as const, title: o.title, status: o.status, updatedAt: o.updatedAt, href: `/admin/offices/${o.airlineSlug}/${o.slug}` })),
    ...recentAirlines.map((a) => ({ type: 'Airline' as const, title: a.title, status: a.status, updatedAt: a.updatedAt, href: `/admin/airlines/${a.slug}` })),
    ...recentPosts.map((p) => ({ type: 'Blog' as const, title: p.title, status: p.status, updatedAt: p.updatedAt, href: `/admin/blog/${p.slug}` })),
  ]

  return merged
    .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
    .slice(0, 8)
}

const QUICK_ACTIONS = [
  { href: '/admin/offices/new', label: 'New Office' },
  { href: '/admin/airlines/new', label: 'New Airline' },
  { href: '/admin/blog/new', label: 'New Post' },
]

// One source of truth for the three content states — shared by the StatusBar
// segments and the legend below. Colors match the StatusBadge used across every
// admin table (green = live, blue = scheduled, amber = draft) so the same state
// always reads the same color everywhere.
const STATUS_STYLES = [
  { key: 'published', label: 'Live', color: '#16a34a' },
  { key: 'scheduled', label: 'Scheduled', color: '#2563eb' },
  { key: 'draft', label: 'Draft', color: '#f59e0b' },
] as const

function StatusBar({ counts }: { counts: { published: number; scheduled: number; draft: number } }) {
  const total = counts.published + counts.scheduled + counts.draft || 1
  // Color alone conveys meaning here, so label the bar for screen readers and
  // give each segment a title tooltip (WCAG: don't rely on color only).
  const summary = STATUS_STYLES.map((s) => `${counts[s.key]} ${s.label.toLowerCase()}`).join(', ')
  return (
    <div role="img" aria-label={summary} className="flex h-2 overflow-hidden rounded-full bg-muted">
      {STATUS_STYLES.map((s) => (
        <div
          key={s.key}
          title={`${s.label}: ${counts[s.key]}`}
          style={{ width: `${(counts[s.key] / total) * 100}%`, background: s.color }}
        />
      ))}
    </div>
  )
}

// Single source for how each content type is shown across the dashboard — icon,
// accent colour and label. The KPI tiles, the recent-activity rows and the
// scheduled list all read from this so the same entity always looks the same
// (previously the tiles used icons while the lists used bare text).
const ENTITY_META = {
  offices: { label: 'Offices', single: 'Office', icon: Building2, accent: 'var(--primary)' },
  airlines: { label: 'Airlines', single: 'Airline', icon: Plane, accent: '#0ea5e9' },
  blog: { label: 'Blog Posts', single: 'Blog', icon: Newspaper, accent: '#f59e0b' },
} as const satisfies Record<EntityType, { label: string; single: string; icon: React.ComponentType<{ className?: string }>; accent: string }>

const ENTITY_BY_SINGLE: Record<'Office' | 'Airline' | 'Blog', (typeof ENTITY_META)[EntityType]> = {
  Office: ENTITY_META.offices,
  Airline: ENTITY_META.airlines,
  Blog: ENTITY_META.blog,
}

// Small colored icon tile for a content type — mirrors the KPI-tile icon style
// so a row's type is scannable by icon+colour instead of a plain text label.
function EntityTag({ type }: { type: 'Office' | 'Airline' | 'Blog' }) {
  const meta = ENTITY_BY_SINGLE[type]
  const Icon = meta.icon
  return (
    <span
      title={type}
      aria-label={type}
      className="flex size-7 shrink-0 items-center justify-center rounded-md"
      style={{ background: `color-mix(in oklch, ${meta.accent} 14%, transparent)`, color: meta.accent }}
    >
      <Icon className="size-4" />
    </span>
  )
}

export default async function AdminDashboard() {
  const [session, officeCounts, airlineCounts, blogCounts, dash, activity, health] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getOfficeStatusCounts(),
    getAirlineStatusCounts(),
    getBlogStatusCounts(),
    getDashboardData(),
    getRecentActivity(),
    getContentHealth(),
  ])

  const total = (c: { draft: number; scheduled: number; published: number }) => c.draft + c.scheduled + c.published

  const countsByKey: Record<EntityType, typeof officeCounts> = {
    offices: officeCounts,
    airlines: airlineCounts,
    blog: blogCounts,
  }

  // Derived from ENTITY_META so the tiles share icon/accent/label with the rows.
  const tiles = (Object.keys(ENTITY_META) as EntityType[]).map((key) => ({
    key,
    label: ENTITY_META[key].label,
    href: `/admin/${key}`,
    icon: ENTITY_META[key].icon,
    accent: ENTITY_META[key].accent,
    value: total(countsByKey[key]),
    spark: dash.months.map((m) => m[key]),
  }))

  const statusRows = [
    { label: 'Offices', counts: officeCounts },
    { label: 'Airlines', counts: airlineCounts },
    { label: 'Blog', counts: blogCounts },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {session?.user?.name || 'Admin'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map((a, i) => (
            <Button key={a.href} asChild variant={i === 0 ? 'default' : 'outline'} size="sm">
              <Link href={a.href}>
                <Plus className="h-4 w-4" /> {a.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <StatTile
            key={t.key}
            label={t.label}
            value={t.value}
            href={t.href}
            icon={t.icon}
            accent={t.accent}
            spark={t.spark}
            trend={dash.trends[t.key]}
          />
        ))}
      </div>

      {/* SEO content health */}
      <ContentHealthCard health={health} />

      {/* Chart + side widgets */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" /> Publishing activity
              </CardTitle>
              <p className="text-sm text-muted-foreground">Items published over the last 6 months</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {dash.publishedTotal} total
            </span>
          </CardHeader>
          <CardContent>
            <PublicationsChart months={dash.months} />
          </CardContent>
        </Card>

        {/* Content status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-muted-foreground" /> Content status
            </CardTitle>
            <p className="text-sm text-muted-foreground">Live · scheduled · draft</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusRows.map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.counts.published} live · {row.counts.scheduled} sched · {row.counts.draft} draft
                  </span>
                </div>
                <StatusBar counts={row.counts} />
              </div>
            ))}
            <div className="flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
              {STATUS_STYLES.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} /> {s.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity + scheduled */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {activity.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing yet — create your first entry.</p>
            )}
            {activity.map((item, i) => (
              <Link key={i} href={item.href} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted">
                <span className="flex min-w-0 items-center gap-2.5">
                  <EntityTag type={item.type} />
                  <span className="truncate">{item.title}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={item.status} />
                  <span className="hidden text-xs text-muted-foreground sm:inline">{item.updatedAt?.toLocaleDateString() ?? ''}</span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" /> Scheduled to publish
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {dash.upcoming.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No scheduled content.</p>
            )}
            {dash.upcoming.map((item, i) => (
              <Link key={i} href={item.href} className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted">
                <span className="flex min-w-0 items-center gap-2.5">
                  <EntityTag type={item.type} />
                  <span className="truncate">{item.title}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(item.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
