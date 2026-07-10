import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  label: string
  href?: string
}

// Shared breadcrumb for public detail pages. One separator style (chevron,
// aria-hidden) everywhere — replaces the ad-hoc `»` / `›` characters that
// previously differed per page and were read aloud by screen readers.
// `tone` adapts the colors for dark hero backgrounds vs light page bodies.
export default function Breadcrumb({
  items,
  tone = 'dark',
  className = '',
}: {
  items: Crumb[]
  tone?: 'dark' | 'light'
  className?: string
}) {
  const linkCls =
    tone === 'dark'
      ? 'text-blue-200 hover:text-white'
      : 'text-gray-500 hover:text-blue-800'
  const currentCls = tone === 'dark' ? 'text-white' : 'text-gray-700'
  const sepCls = tone === 'dark' ? 'text-blue-300/60' : 'text-gray-300'

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-1.5 text-sm font-medium ${className}`}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link href={item.href} className={`transition-colors ${linkCls}`}>
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? currentCls : linkCls}>{item.label}</span>
            )}
            {!isLast && <ChevronRight aria-hidden="true" className={`size-3.5 ${sepCls}`} />}
          </span>
        )
      })}
    </nav>
  )
}
