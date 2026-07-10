import { unstable_cache, revalidateTag } from 'next/cache'

// Public pages are force-dynamic (Railway's build phase can't reach the private
// DB host, so build-time prerendering is off). That means every request re-runs
// the DB reads. unstable_cache adds a persistent, cross-request data cache on
// top of those reads — independent of the route's render mode — so repeated
// visits are served from cache and the DB is hit at most once per revalidate
// window (or until an admin mutation busts the tag).

export const CACHE_TAGS = {
  airlines: 'airlines',
  offices: 'offices',
  blog: 'blog',
  taxonomy: 'taxonomy',
  settings: 'settings',
  redirects: 'redirects',
} as const

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]

// 5 minutes: a directory changes rarely, and admin edits bust the relevant tag
// immediately (below), so this is just the background-refresh ceiling.
const REVALIDATE_SECONDS = 300

// Wrap a DB-reading function in the persistent data cache. The function's own
// arguments are part of the cache key automatically; `keyParts` namespaces it.
//
// IMPORTANT: unstable_cache does not cache a rejected promise. Keep any
// error-fallback (e.g. return [] when the DB is unreachable at build) in a
// wrapper OUTSIDE this call — letting the inner fn throw — so a transient
// failure is never cached and poisons reads for the whole revalidate window.
export function cachedRead<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
  tags: CacheTag[]
): (...args: A) => Promise<R> {
  return unstable_cache(fn, keyParts, { tags, revalidate: REVALIDATE_SECONDS })
}

// Mark tagged data stale after a mutation. Centralizes Next 16's required
// two-argument revalidateTag(tag, 'max') — the single-arg form is deprecated and
// errors under TypeScript. 'max' = stale-while-revalidate: the next visit to a
// page using the tag serves stale content and refreshes in the background.
export function bustTags(...tags: CacheTag[]): void {
  for (const tag of tags) revalidateTag(tag, 'max')
}
