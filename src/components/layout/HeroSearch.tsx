'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export default function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/airlines/?q=${encodeURIComponent(q)}` : '/airlines/')
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="mx-auto flex w-full max-w-xl items-center gap-2 rounded-full bg-white p-1.5 shadow-lg ring-1 ring-white/20"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search airlines by name or IATA code
      </label>
      <div className="flex flex-1 items-center gap-2 pl-3">
        <Search aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
        <input
          id="hero-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search airline name or IATA code…"
          className="w-full bg-transparent py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  )
}
