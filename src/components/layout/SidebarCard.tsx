import type { LucideIcon } from 'lucide-react'

// Shared sidebar card for public detail pages (office + airline hub). One
// header treatment everywhere — white header, blue icon tile, consistent border
// and rounding — instead of the per-card colored bands that previously varied.
// `flush` renders children edge-to-edge (for divided lists); otherwise they're
// padded.
export default function SidebarCard({
  icon: Icon,
  title,
  flush,
  children,
}: {
  icon: LucideIcon
  title: string
  flush?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
          <Icon className="size-4" />
        </span>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      </div>
      {flush ? children : <div className="p-4">{children}</div>}
    </div>
  )
}
