import Link from 'next/link'
import { Building2, PhoneCall, ShieldCheck } from 'lucide-react'
import HeroSearch from '@/components/layout/HeroSearch'
import { getSettings } from '@/lib/data/getSettings'
import { getAllAirlines } from '@/lib/data/getAirline'
import { telHref } from '@/lib/utils'

export default async function Homebanner() {
  const [settings, airlines] = await Promise.all([getSettings(), getAllAirlines()])
  const tel = telHref(settings.contactPhone)

  // Quick links under the search bar — featured airlines first, busiest as fallback.
  const featured = airlines.filter((a) => a.isFeatured)
  const popular = (featured.length >= 3
    ? featured
    : [...airlines].sort((a, b) => b.officeCount - a.officeCount)
  ).slice(0, 5)

  const stats = [
    { value: settings.statAirlines, label: 'Airlines Listed' },
    { value: settings.statOffices, label: 'Office Locations' },
    { value: settings.statCountries, label: 'Countries Covered' },
  ]

  return (
    <section className="relative isolate overflow-hidden bg-slate-900">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-slate-800 via-slate-900 to-slate-900" />

      {/* Dotted flight path behind the heading */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 320"
        fill="none"
        className="pointer-events-none absolute inset-x-0 top-10 -z-10 hidden w-full text-slate-600 sm:block"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-40 280 C 260 40, 560 40, 700 140 S 1080 260, 1260 80"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="1 10"
          strokeLinecap="round"
        />
        <circle cx="700" cy="140" r="3" fill="currentColor" />
        <circle cx="260" cy="122" r="3" fill="currentColor" />
      </svg>

      {/* Decorative blur shapes */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-blue-700 to-sky-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8 text-center">
        {/* Trust line */}
        <div className="mb-8 flex justify-center">
          <p className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-slate-200 ring-1 ring-white/20 backdrop-blur-sm bg-white/5">
            <ShieldCheck aria-hidden="true" className="size-4 text-sky-400" />
            Manually verified contacts, reviewed regularly
          </p>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Airline Offices Far or Near,{' '}
          <span className="text-sky-400">All Routes Lead Here</span>
        </h1>

        <p className="mt-6 text-lg text-slate-300 sm:text-xl/8 max-w-2xl mx-auto">
          Search verified addresses, contact numbers, working hours and headquarters
          information for airlines around the world — all in one trusted directory.
        </p>

        {/* Search — the primary CTA */}
        <div className="mt-10">
          <HeroSearch />
        </div>

        {/* Popular quick links */}
        {popular.length > 0 && (
          <nav
            aria-label="Popular airlines"
            className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Popular:
            </span>
            {popular.map((airline) => (
              <Link
                key={airline.slug}
                href={`/${airline.slug}/`}
                className="rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200 ring-1 ring-white/15 transition-colors hover:bg-white/15 hover:text-white"
              >
                {airline.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Secondary actions */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {settings.contactPhone && (
            <a
              href={tel}
              className="inline-flex items-center gap-2 rounded-md bg-orange-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-orange-700 transition-colors"
            >
              <PhoneCall aria-hidden="true" className="size-4" />
              Call Now: {settings.contactPhone}
            </a>
          )}
          <Link
            href="/airlines"
            className="inline-flex items-center gap-2 rounded-md bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <Building2 aria-hidden="true" className="size-4" />
            Browse All Airlines
          </Link>
        </div>

        {/* Stats */}
        <dl className="mx-auto mt-16 flex max-w-2xl flex-col items-center justify-center gap-8 sm:flex-row sm:gap-0 sm:divide-x sm:divide-white/10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-10">
              <dt className="text-3xl font-bold text-white tabular-nums">{stat.value}</dt>
              <dd className="mt-1 text-sm text-slate-400">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-blue-700 to-sky-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-288.75"
        />
      </div>
    </section>
  )
}
