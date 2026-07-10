import { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

// `path` must be a same-origin, root-relative path — never redirect to an
// absolute/external URL taken from a query string (open-redirect).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  const draft = await draftMode()
  draft.disable()

  redirect(path && path.startsWith('/') && !path.startsWith('//') ? path : '/')
}
