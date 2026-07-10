'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { recordRedirect } from '@/lib/redirects'
import { bustTags, CACHE_TAGS } from '@/lib/cache'
import { logActivity } from '@/lib/activity'

// Site-relative paths only — matches how getRedirectTarget() compares against
// the incoming pathname (see [airlineSlug], [airlineSlug]/[officeSlug] and
// blog/[slug] page.tsx). No scheme, no spaces.
const pathSchema = z.string().trim().min(1).max(300)
  .regex(/^\/\S*$/, 'Must start with / and contain no spaces')

function revalidateRedirectsPath() {
  bustTags(CACHE_TAGS.redirects)
  revalidatePath('/admin/redirects')
}

// Reuses the same recordRedirect() that slug renames call — keeps chains flat
// (A->B, then later B->C collapses to A->C) whether the row came from an
// automatic rename or a manually-added entry here.
export async function createManualRedirect(fromPath: string, toPath: string) {
  const session = await requireRole('admin')
  const from = pathSchema.parse(fromPath)
  const to = pathSchema.parse(toPath)
  if (from === to) throw new Error('From and To must be different paths.')

  await recordRedirect(from, to)
  revalidateRedirectsPath()
  await logActivity(session.user, {
    action: 'created',
    entityType: 'redirect',
    entityTitle: `${from} → ${to}`,
    href: '/admin/redirects',
  })
}

export async function deleteRedirect(id: number) {
  const session = await requireRole('admin')
  const [row] = await db.select({ fromPath: redirects.fromPath, toPath: redirects.toPath })
    .from(redirects).where(eq(redirects.id, id))
  if (!row) return

  await db.delete(redirects).where(eq(redirects.id, id))
  revalidateRedirectsPath()
  await logActivity(session.user, {
    action: 'deleted',
    entityType: 'redirect',
    entityTitle: `${row.fromPath} → ${row.toPath}`,
  })
}
