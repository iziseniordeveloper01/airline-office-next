import Link from 'next/link'
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrendStat } from '@/lib/data/getDashboard'

interface Props {
  label: string
  value: number
  href: string
  icon: React.ComponentType<{ className?: string }>
  accent: string // css color
  spark: number[]
  trend: TrendStat
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(1, ...data)
  const n = data.length
  const pts = data
    .map((v, i) => `${n <= 1 ? 50 : (i / (n - 1)) * 100},${4 + (1 - v / max) * 22}`)
    .join(' ')
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-20 overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export default function StatTile({ label, value, href, icon: Icon, accent, spark, trend }: Props) {
  const { deltaPct, last30 } = trend
  const up = deltaPct != null && deltaPct >= 0

  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-xl bg-card p-5 text-card-foreground ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in oklch, ${accent} 14%, transparent)`, color: accent }}
          >
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{value.toLocaleString()}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {deltaPct != null ? (
              <span className={cn('flex items-center gap-0.5 font-medium', up ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(deltaPct)}%
              </span>
            ) : last30 > 0 ? (
              <span className="flex items-center gap-0.5 font-medium text-green-600 dark:text-green-400">
                <TrendingUp className="h-3.5 w-3.5" /> New
              </span>
            ) : (
              <span className="text-muted-foreground">No change</span>
            )}
            <span className="text-muted-foreground">vs prev 30d</span>
          </div>
        </div>
        <Sparkline data={spark} color={accent} />
      </div>
    </Link>
  )
}
