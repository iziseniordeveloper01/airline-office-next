import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { and, eq, lte } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines, offices, blogPosts } from '@/lib/schema'
import { notTrashed } from '@/lib/visibility'
import { bustTags, CACHE_TAGS } from '@/lib/cache'

// Cleanliness only — the on-read visibility helper (src/lib/visibility.ts) already
// guarantees a due scheduled row is correct the instant its own detail URL is
// requested, with or without this route ever running. This exists so (a) the status
// column visibly flips to 'published' instead of staying 'scheduled' forever, and
// (b) cached LISTING pages (blog index, airline hub, homepage) refresh promptly —
// dynamicParams alone only covers a row's own detail page, not pages that list it.
export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  for (const table of [airlines, offices, blogPosts] as const) {
    await db
      .update(table)
      .set({ status: 'published', publishedAt: now })
      .where(and(eq(table.status, 'scheduled'), lte(table.scheduledAt, now), notTrashed(table)))
  }

  // Newly-live rows must drop out of the cached listings immediately, so bust
  // every content tag alongside the path revalidation.
  bustTags(CACHE_TAGS.airlines, CACHE_TAGS.offices, CACHE_TAGS.blog, CACHE_TAGS.taxonomy)
  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true, ranAt: now.toISOString() })
}
