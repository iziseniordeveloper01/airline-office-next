import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-revalidate-token')
  if (token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { airlineSlug, officeSlug } = await req.json()

  // Specific pages revalidate karo
  revalidatePath(`/${airlineSlug}/${officeSlug}`)
  revalidatePath(`/${airlineSlug}`)
  revalidatePath('/sitemap.xml')

  return NextResponse.json({
    revalidated: true,
    at: new Date().toISOString(),
  })
}