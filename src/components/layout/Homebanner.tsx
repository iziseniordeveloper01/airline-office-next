import Link from 'next/link'
import { Search, MapPin, Building2, PhoneCall } from 'lucide-react'

export default function Homebanner() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-900">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/home/hero-airport.jpg"
          alt="Airport terminal with airplane"
          className="size-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/80 via-slate-900/70 to-slate-900" />
      </div>

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
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-indigo-500 to-green-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 py-28 sm:py-36 lg:px-8 text-center">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <div className="relative rounded-full px-4 py-1.5 text-sm text-slate-200 ring-1 ring-white/20 backdrop-blur-sm bg-white/5">
            🌍 Covering 500+ Airlines &amp; 2000+ Office Locations
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Airline Offices Far or Near,{' '}
          <span className="text-green-400">All Routes Lead Here</span>
        </h1>

        <p className="mt-6 text-lg text-slate-300 sm:text-xl/8 max-w-2xl mx-auto">
          Search verified addresses, contact numbers, working hours and headquarters
          information for airlines around the world — all in one trusted directory.
        </p>

        {/* Search bar */}
        <form action="/search" className="mt-10 mx-auto max-w-xl">
          <div className="flex items-center gap-2 rounded-full bg-white p-2 shadow-2xl ring-1 ring-black/5">
            <Search className="ml-3 size-5 text-gray-400 shrink-0" />
            <input
              type="text"
              name="q"
              placeholder="Search airline, city, or office..."
              className="flex-1 border-0 bg-transparent px-2 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/airlines"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
          >
            <Building2 className="size-4" />
            Browse Airlines
          </Link>
          <Link
            href="/headquarters"
            className="inline-flex items-center gap-2 rounded-md bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <MapPin className="size-4" />
            View Headquarters
          </Link>
          <a
            href="tel:+18772947147"
            className="inline-flex items-center gap-2 rounded-md bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-green-600 transition-colors"
          >
            <PhoneCall className="size-4" />
            Call Now
          </a>
        </div>

        {/* Stats */}
        <dl className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3 max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <dt className="text-3xl font-bold text-white">500+</dt>
            <dd className="mt-1 text-sm text-slate-400">Airlines Listed</dd>
          </div>
          <div className="flex flex-col items-center">
            <dt className="text-3xl font-bold text-white">2,000+</dt>
            <dd className="mt-1 text-sm text-slate-400">Office Locations</dd>
          </div>
          <div className="flex flex-col items-center">
            <dt className="text-3xl font-bold text-white">120+</dt>
            <dd className="mt-1 text-sm text-slate-400">Countries Covered</dd>
          </div>
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
          className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-indigo-500 to-green-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-288.75"
        />
      </div>
    </section>
  )
}