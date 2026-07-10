import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { cachedRead, bustTags, CACHE_TAGS } from '@/lib/cache'

// The public pages look redirects up by the bare slug path — e.g.
// `/${airlineSlug}/${officeSlug}` — which never has a trailing slash even
// though trailingSlash: true means every rendered/copyable URL on the site
// does. A manually-added redirect pasted straight from the browser's address
// bar would otherwise store a fromPath that can never match that lookup.
function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

// Called whenever a live airline/office/blog slug changes. Keeps redirect chains
// flat at write time (A->B, later B->C becomes A->C directly) so reads never need
// to follow more than one hop, and clears any stale redirect that would now
// shadow the path being reused as live content again (rename away, then back).
export async function recordRedirect(fromPathRaw: string, toPathRaw: string): Promise<void> {
  const fromPath = normalizePath(fromPathRaw)
  const toPath = normalizePath(toPathRaw)
  if (fromPath === toPath) return
  await db.transaction(async (tx) => {
    await tx.update(redirects).set({ toPath }).where(eq(redirects.toPath, fromPath))
    await tx.delete(redirects).where(eq(redirects.fromPath, toPath))
    await tx.delete(redirects).where(eq(redirects.fromPath, fromPath))
    await tx.insert(redirects).values({ fromPath, toPath })
  })
  bustTags(CACHE_TAGS.redirects)
}

export const getRedirectTarget = cachedRead(
  readRedirectTarget,
  ['redirect:by-path'],
  [CACHE_TAGS.redirects]
)

async function readRedirectTarget(fromPath: string): Promise<string | null> {
  const row = await db.query.redirects.findFirst({ where: eq(redirects.fromPath, fromPath) })
  return row?.toPath ?? null
}
