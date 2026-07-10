'use client'

import type { SeoLevel, SeoScoreResult } from '@/lib/seo/scoreSeo'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Same green/amber pairing as StatusBadge.tsx, plus a red pair for 'poor' — kept
// in this file rather than added to StatusBadge's STYLES since that map is keyed
// by content status, not SEO level.
const DOT: Record<SeoLevel, string> = {
  good: 'bg-green-500',
  ok: 'bg-amber-500',
  poor: 'bg-red-500',
}

const BADGE: Record<SeoLevel, string> = {
  good: 'bg-green-50 text-green-700',
  ok: 'bg-amber-50 text-amber-600',
  poor: 'bg-red-50 text-red-600',
}

const LABEL: Record<SeoLevel, string> = {
  good: 'Good SEO',
  ok: 'OK SEO',
  poor: 'Needs work',
}

export default function SeoScoreIndicator({ result }: { result: SeoScoreResult }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[result.level]}`}
        >
          <span className={`size-1.5 rounded-full ${DOT[result.level]}`} aria-hidden="true" />
          {LABEL[result.level]} · {result.score}/100
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        {result.messages.length === 0 ? (
          <p className="text-muted-foreground">All checks pass.</p>
        ) : (
          <ul className="space-y-1.5">
            {result.messages.map((m, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-1 size-1.5 shrink-0 rounded-full ${DOT[m.level]}`} aria-hidden="true" />
                <span>{m.text}</span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
