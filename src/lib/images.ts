import { db } from '@/lib/db'
import { images } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { getImageUsage } from '@/lib/data/getMedia'

export function imageUrl(id?: string | null): string | null {
  return id ? `/api/images/${id}` : null
}

// Called after an entity save to clean up a swapped-out image. Since the media
// library lets an image be reused across entities, we only delete when the old
// id is no longer referenced anywhere (FK column or embedded in Tiptap content)
// — otherwise we'd orphan an image another entity still points to.
export async function deleteReplacedImage(oldId: string | null | undefined, newId: string | null | undefined) {
  if (!oldId || oldId === newId) return
  const usage = await getImageUsage(oldId)
  if (usage.inUse) return
  await db.delete(images).where(eq(images.id, oldId))
}
