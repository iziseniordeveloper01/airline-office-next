import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Simple token auth — .env se compare karo
  const token = req.headers.get('x-admin-token')
  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await req.json()

    if (!data.slug || !data.airlineSlug || !data.fullTitle) {
      return NextResponse.json(
        { error: 'Required: slug, airlineSlug, fullTitle' },
        { status: 400 }
      )
    }

    // Slug sanitize karo
    const safeSlug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const safeAirline = data.airlineSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Folder banao agar exist nahi karta
    const dir = path.join(process.cwd(), 'data/offices', safeAirline)
    mkdirSync(dir, { recursive: true })

    // JSON file save karo
    const filePath = path.join(dir, `${safeSlug}.json`)
    const officeData = {
      ...data,
      slug: safeSlug,
      airlineSlug: safeAirline,
      updatedAt: new Date().toISOString().split('T')[0],
    }
    writeFileSync(filePath, JSON.stringify(officeData, null, 2))

    // ISR revalidate trigger karo — live page update ho jaye
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    if (siteUrl) {
      await fetch(`${siteUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-token': process.env.REVALIDATE_TOKEN!,
        },
        body: JSON.stringify({ airlineSlug: safeAirline, officeSlug: safeSlug }),
      })
    }

    return NextResponse.json({
      success: true,
      url: `/${safeAirline}/${safeSlug}/`,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}