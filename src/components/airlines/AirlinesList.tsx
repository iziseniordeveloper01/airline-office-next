'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Search, X } from 'lucide-react'
import type { AirlineIndex } from '@/types'

// Read the ?q= deep-link from the URL without pulling in useSearchParams, which
// would force a client-only bailout and strip the server-rendered grid (and its
// crawlable links) from the static HTML. The server snapshot is '' so SSR renders
// the full list; React swaps in the client value after hydration (no mismatch).
const subscribe = () => () => {}
const getServerSnapshot = () => ''
const getSnapshot = () => new URLSearchParams(window.location.search).get('q') ?? ''

export default function AirlinesList({ airlines }: { airlines: AirlineIndex[] }) {
  const initialQuery = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // null = user hasn't touched the field yet, so fall back to the URL deep-link.
  const [typed, setTyped] = useState<string | null>(null)
  const query = typed ?? initialQuery
  const setQuery = setTyped

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return airlines
    return airlines.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.iataCode.toLowerCase().includes(q),
    )
  }, [airlines, query])

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <label htmlFor="airline-search" className="sr-only">
          Search airlines by name or IATA code
        </label>
        <div className="relative max-w-md">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-gray-400"
          />
          <input
            id="airline-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search airline name or IATA code…"
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500" aria-live="polite">
          {filtered.length} airline{filtered.length === 1 ? '' : 's'}
          {query.trim() && ' found'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <Search aria-hidden="true" className="mx-auto size-8 text-gray-300" />
          <p className="mt-3 text-sm text-gray-600">
            No airlines match &ldquo;{query.trim()}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <X className="size-4" />
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((airline) => (
            <Link
              key={airline.slug}
              href={`/${airline.slug}/`}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-[color,border-color,box-shadow]"
            >
              <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {airline.logo ? (
                  <Image src={airline.logo} alt={airline.name} width={40} height={40} className="object-contain" />
                ) : (
                  <Building2 className="size-5 text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">{airline.name}</div>
                <div className="text-xs text-gray-500">
                  {airline.iataCode && <span className="font-mono">{airline.iataCode}</span>}
                  {airline.iataCode && ' · '}
                  {airline.officeCount} office{airline.officeCount === 1 ? '' : 's'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
