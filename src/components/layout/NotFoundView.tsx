import Link from 'next/link'
import { Building2, Home, MapPin, Newspaper, PlaneTakeoff } from 'lucide-react'
import HeroSearch from '@/components/layout/HeroSearch'

const quickLinks = [
  { href: '/airlines', label: 'Browse Airlines', icon: Building2 },
  { href: '/headquarters', label: 'Headquarters', icon: MapPin },
  { href: '/blog', label: 'Travel Blog', icon: Newspaper },
  { href: '/', label: 'Go Home', icon: Home },
]

// Shared 404 body. Deliberately does no DB read so it stays static and can't
// fail during build or a DB outage. Used by both the (site) not-found (which
// gets Navbar/Footer from the group layout) and the root not-found fallback.
export default function NotFoundView({ withBrand = false }: { withBrand?: boolean }) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      {withBrand && (
        <Link href="/" className="mb-10 flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-blue-800">
            <PlaneTakeoff className="size-5 text-white" />
          </span>
          <span className="text-lg font-bold text-gray-900">
            Airline<span className="text-blue-800">Office</span>Directory
          </span>
        </Link>
      )}

      <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">404 — Page not found</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        This route didn&apos;t land anywhere
      </h1>
      <p className="mt-4 text-base text-gray-600">
        The office or page you&apos;re looking for may have moved or never existed. Search for an
        airline below, or head back to a main section.
      </p>

      <div className="mt-8 w-full">
        <HeroSearch />
      </div>

      <nav aria-label="Helpful links" className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-800"
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  )
}
