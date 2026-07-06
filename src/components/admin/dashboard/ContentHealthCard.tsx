import Link from 'next/link'
import { HeartPulse, ArrowRight } from 'lucide-react'
import type { ContentHealth } from '@/lib/data/getContentHealth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Server component — pure render off getContentHealth(). Ring is hand-rolled
// SVG per the project's no-chart-library rule.
function ScoreRing({ score }: { score: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const color = score >= 80 ? 'var(--primary)' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg viewBox="0 0 80 80" className="size-24 shrink-0" role="img" aria-label={`Content health score ${score} out of 100`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central"
        className="fill-foreground text-xl font-bold" style={{ fontSize: 20 }}>
        {score}
      </text>
    </svg>
  )
}

export default function ContentHealthCard({ health }: { health: ContentHealth }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-muted-foreground" /> Content health
          </CardTitle>
          <p className="text-sm text-muted-foreground">SEO completeness of live content</p>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <ScoreRing score={health.score} />
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">{health.healthyCount}</span>
              <span className="text-muted-foreground"> of {health.totalChecked} live items complete</span>
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {health.issueCounts.slice(0, 4).map((i) => (
                <Badge key={i.label} variant="secondary" className="font-normal">
                  {i.label} · {i.count}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Needs attention */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Needs attention</CardTitle>
          <p className="text-sm text-muted-foreground">Live pages with the most SEO gaps — click to fix</p>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {health.needsAttention.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Everything looks great — no SEO gaps on live content. 🎉
            </p>
          )}
          {health.needsAttention.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground">{item.type}</span>
                <span className="truncate">{item.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="hidden max-w-72 truncate text-xs text-muted-foreground md:inline">
                  {item.issues.slice(0, 3).join(' · ')}
                  {item.issues.length > 3 && ` +${item.issues.length - 3}`}
                </span>
                <Badge variant="destructive">{item.issues.length}</Badge>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
