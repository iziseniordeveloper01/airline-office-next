import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { cachedRead, bustTags, CACHE_TAGS } from '@/lib/cache'

// Called whenever a live airline/office/blog slug changes. Keeps redirect chains
// flat at write time (A->B, later B->C becomes A->C directly) so reads never need
// to follow more than one hop, and clears any stale redirect that would now
// shadow the path being reused as live content again (rename away, then back).
export async function recordRedirect(fromPath: string, toPath: string): Promise<void> {
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
