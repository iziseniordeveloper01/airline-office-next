'use client'

import { useState } from 'react'
import type { MonthPoint } from '@/lib/data/getDashboard'

const SERIES = [
  { key: 'offices', label: 'Offices', color: 'var(--primary)' },
  { key: 'airlines', label: 'Airlines', color: '#0ea5e9' },
  { key: 'blog', label: 'Blog', color: '#f59e0b' },
] as const

// Dependency-free SVG area chart. Uses a 0..100 viewBox with
// preserveAspectRatio="none" so an HTML overlay can position dots/tooltips by
// simple percentages; the line stroke stays crisp via non-scaling-stroke.
export default function PublicationsChart({ months }: { months: MonthPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const n = months.length
  const max = Math.max(1, ...months.map((m) => m.total))

  const x = (i: number) => (n <= 1 ? 50 : 2 + (i / (n - 1)) * 96)
  const y = (v: number) => 8 + (1 - v / max) * 84

  const linePts = months.map((m, i) => `${x(i)},${y(m.total)}`).join(' ')
  const areaPath = `M ${x(0)},92 L ${months.map((m, i) => `${x(i)},${y(m.total)}`).join(' L ')} L ${x(n - 1)},92 Z`

  const activeMonth = active != null ? months[active] : null

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div
        className="relative h-48 w-full sm:h-56"
        onMouseLeave={() => setActive(null)}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="pubFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* horizontal gridlines */}
          {[8, 29.3, 50.6, 71.9, 92].map((gy) => (
            <line key={gy} x1="0" y1={gy} x2="100" y2={gy} stroke="var(--border)" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={areaPath} fill="url(#pubFill)" />
          <polyline
            points={linePts}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* HTML overlay: hover columns, active dot + guide */}
        <div className="absolute inset-0 flex">
          {months.map((m, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${m.label}: ${m.total} published`}
              onMouseEnter={() => setActive(i)}
              className="group relative flex-1"
            >
              {active === i && <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />}
            </button>
          ))}
        </div>

        {activeMonth && active != null && (
          <>
            <span
              className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow"
              style={{ left: `${x(active)}%`, top: `${y(activeMonth.total)}%` }}
            />
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-md"
              style={{ left: `${Math.min(88, Math.max(12, x(active)))}%`, top: `${Math.max(14, y(activeMonth.total) - 6)}%` }}
            >
              <p className="mb-0.5 font-medium">{activeMonth.label}</p>
              {SERIES.map((s) => (
                <p key={s.key} className="flex items-center gap-1.5 whitespace-nowrap text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}: <span className="font-medium text-foreground">{activeMonth[s.key]}</span>
                </p>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex justify-between px-1 text-[11px] text-muted-foreground">
        {months.map((m, i) => (
          <span key={i}>{m.label}</span>
        ))}
      </div>
    </div>
  )
}
