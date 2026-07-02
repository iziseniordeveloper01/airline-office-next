'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { images } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { logActivity } from '@/lib/activity'
import { getImageUsage, getMediaPage, type MediaItem } from '@/lib/data/getMedia'

// Client-side fetch for the picker dialog (search + paging without navigation).
export async function listMedia(q: string, page: number): Promise<{ rows: MediaItem[]; total: number }> {
  await requireRole('editor')
  return getMediaPage({ q: q || undefined, page })
}

export async function getUsage(id: string) {
  await requireRole('editor')
  return getImageUsage(id)
}

export async function deleteMedia(id: string) {
  const session = await requireRole('admin')

  // Refuse to orphan referenced media — a hard FK delete would fail anyway, and
  // an embedded content image would 404 on the public site.
  const usage = await getImageUsage(id)
  if (usage.inUse) {
    const where = usage.refs.slice(0, 3).map((r) => `${r.type} “${r.title}”`).join(', ')
    throw new Error(
      `Still in use by ${usage.refs.length} item${usage.refs.length > 1 ? 's' : ''}${where ? ` (${where}${usage.refs.length > 3 ? '…' : ''})` : ''}. Remove it there first.`
    )
  }

  const [img] = await db.select({ filename: images.filename }).from(images).where(eq(images.id, id))
  await db.delete(images).where(eq(images.id, id))
  revalidatePath('/admin/media')
  await logActivity(session.user, { action: 'deleted', entityType: 'media', entityId: id, entityTitle: img?.filename ?? 'image' })
}
