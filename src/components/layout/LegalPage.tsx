import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

// Shared shell for the static company/legal pages (About, Contact, Privacy,
// Terms, Disclaimer). Header band matches the /airlines and /blog list pages.
// Children are rendered raw so each page controls its own typography — text
// pages wrap their body in `.prose-content` (globals.css), while pages with
// interactive cards (Contact) keep those outside prose to avoid link styling.
export default function LegalPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string
  intro?: string
  updated?: string
  children: React.ReactNode
}) {
  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="bg-blue-800 text-white py-12">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-sm text-blue-200">
            <Link href="/" className="transition-colors hover:text-white">Home</Link>
            <ChevronRight aria-hidden="true" className="size-3.5 text-blue-300/70" />
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          {intro && <p className="mt-2 max-w-2xl text-blue-100">{intro}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        <article className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-10 shadow-sm">
          {children}
          {updated && (
            <p className="mt-10 border-t border-gray-100 pt-6 text-sm text-gray-400">
              Last updated: {updated}
            </p>
          )}
        </article>
      </div>
    </main>
  )
}
