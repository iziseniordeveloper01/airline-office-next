'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RotateCw } from 'lucide-react'

// Route-level error boundary for the public site. Renders inside the (site)
// layout, so Navbar/Footer stay. `reset()` re-renders the failed segment.
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surface in server/edge logs; the digest ties it to the server-side stack.
    console.error('Public route error:', error)
  }, [error])

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 text-base text-gray-600">
        We hit an unexpected error loading this page. Please try again — if it keeps happening,
        come back in a little while.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <RotateCw className="size-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:text-blue-800"
        >
          <Home className="size-4" />
          Go home
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-gray-400">Reference: {error.digest}</p>
      )}
    </section>
  )
}
