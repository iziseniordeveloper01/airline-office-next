import { getSettings } from '@/lib/data/getSettings'

// IndexNow's key-ownership check: the API fetches keyLocation (see
// lib/indexnow.ts's pingIndexNow) and expects the raw key back as plain text.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  const settings = await getSettings()
  if (!settings.indexNowKey || key !== settings.indexNowKey) {
    return new Response('Not Found', { status: 404 })
  }
  return new Response(settings.indexNowKey, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
