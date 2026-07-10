import { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser, HIERARCHY } from '@/lib/auth/requireRole'
import { getAirlineForPreview } from '@/lib/data/getAirline'
import { getOfficeForPreview } from '@/lib/data/getOffice'
import { getBlogPostForPreview } from '@/lib/data/getBlog'
import type { Role } from '@/types'

// Enables Next's draft-mode cookie and redirects to the public URL for a piece
// of not-yet-live content. The cookie alone never grants access — every public
// page re-checks the session/role itself on each request (see the (site) pages'
// draftMode() branch) — this route only exists to set the cookie + do the
// initial lookup so we redirect to a real path, never to a raw querystring value.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const slug = searchParams.get('slug')
  const airlineSlug = searchParams.get('airlineSlug')

  const user = await getCurrentUser()
  const role = user?.role as Role | undefined
  if (!user || !role || HIERARCHY[role] < HIERARCHY.editor) {
    return new Response('Unauthorized', { status: 403 })
  }
  if (!slug) return new Response('Missing slug', { status: 400 })

  let target: string | null = null
  if (type === 'airline') {
    const airline = await getAirlineForPreview(slug)
    target = airline ? `/${airline.slug}/` : null
  } else if (type === 'office') {
    if (!airlineSlug) return new Response('Missing airlineSlug', { status: 400 })
    const office = await getOfficeForPreview(airlineSlug, slug)
    target = office ? `/${office.airlineSlug}/${office.slug}/` : null
  } else if (type === 'blog') {
    const post = await getBlogPostForPreview(slug)
    target = post ? `/blog/${post.slug}/` : null
  } else {
    return new Response('Invalid type', { status: 400 })
  }

  if (!target) return new Response('Not Found', { status: 404 })

  const draft = await draftMode()
  draft.enable()
  redirect(target)
}
