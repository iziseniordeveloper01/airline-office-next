// Shown during navigation to any public route while its server data loads.
// The pages are force-dynamic (per-request DB reads), so this replaces the
// blank-screen wait with a neutral page skeleton. aria-busy announces the
// loading state to assistive tech.
export default function SiteLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      {/* Hero band */}
      <div className="bg-slate-900 px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="h-8 w-2/3 max-w-lg rounded bg-white/10" />
          <div className="h-4 w-1/2 max-w-md rounded bg-white/5" />
        </div>
      </div>

      {/* Content grid */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8 h-6 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 h-10 w-10 rounded-lg bg-gray-200" />
              <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-3 w-1/2 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
