'use client'

import { usePathname } from 'next/navigation'

// Rendered by (site)/layout.tsx only while draftMode().isEnabled — sits in normal
// document flow above the (sticky) Navbar, so it scrolls away naturally instead
// of needing manual offset math against the sticky header.
export default function DraftModeBanner() {
  const pathname = usePathname()
  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <span>Previewing draft content — visitors can&apos;t see this yet.</span>
      <a
        href={`/api/draft/disable?path=${encodeURIComponent(pathname)}`}
        className="underline underline-offset-2 hover:opacity-80"
      >
        Exit preview
      </a>
    </div>
  )
}
