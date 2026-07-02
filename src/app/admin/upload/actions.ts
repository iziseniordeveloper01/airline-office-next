'use server'

import crypto from 'crypto'
import sharp from 'sharp'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { images } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'

export async function uploadImage(formData: FormData) {
  await requireRole('editor')
  const file = formData.get('file') as File
  if (!file?.type.startsWith('image/')) throw new Error('Only images allowed')

  const buffer = Buffer.from(await file.arrayBuffer())
  const id = crypto.randomUUID()

  const optimized = await sharp(buffer)
    .resize(1200, null, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()

  const meta = await sharp(optimized).metadata()

  await db.insert(images).values({
    id,
    filename: file.name,
    mimeType: 'image/webp',
    data: optimized,
    width: meta.width ?? null,
    height: meta.height ?? null,
  })

  return { id, url: `/api/images/${id}` }
}

export async function deleteImageById(id: string) {
  await requireRole('admin')
  await db.delete(images).where(eq(images.id, id))
}
