import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { images } from '@/lib/schema'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const img = await db.query.images.findFirst({ where: eq(images.id, id) })
  if (!img) return new Response('Not Found', { status: 404 })

  const data = img.data as Buffer
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': img.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(data.length),
    },
  })
}
