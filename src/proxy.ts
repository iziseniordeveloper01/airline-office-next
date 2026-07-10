import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

// CVE-2025-29927: proxy/middleware-only protection is bypassable, so this only
// does an optimistic cookie-presence redirect. Real authorization (role checks)
// happens server-side in requireRole(), never here — no DB access in proxy.ts.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /api/* must never get the trailing-slash treatment below — Next's route
  // handlers (especially catch-all ones like Better Auth's) don't resolve a
  // trailing-slash variant, so redirecting here would 404 every API call.
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // trailingSlash: true normalizes every path to end with a slash, so strip it
  // here for exact-match comparisons below — otherwise the login-page check
  // never matches and redirects loop forever.
  const normalizedPathname = pathname.replace(/\/$/, '') || '/'
  const hasSessionCookie = !!getSessionCookie(request)

  // NOTE: no cookie-based "already logged in" bounce away from /admin/login here.
  // The cookie's presence doesn't prove the session is valid (expired/forged), and
  // the admin layout now redirects invalid sessions TO the login page — a proxy
  // bounce in the other direction would loop forever. The login page itself does
  // the authoritative getSession() redirect for genuinely signed-in visitors.

  // Admin routes — login required
  if (normalizedPathname.startsWith('/admin') && normalizedPathname !== '/admin/login' && !hasSessionCookie) {
    const loginUrl = new URL('/admin/login/', request.url)
    loginUrl.searchParams.set('callbackUrl', normalizedPathname)
    return NextResponse.redirect(loginUrl)
  }

  // Everything else: replicate next.config.ts's trailingSlash: true ourselves
  // (disabled globally via skipTrailingSlashRedirect so /api/* above can opt out).
  const isStaticFile = /\.[^/]+$/.test(pathname)
  const isWellKnown = pathname.startsWith('/.well-known/')
  if (!pathname.endsWith('/') && !isStaticFile && !isWellKnown) {
    // Plain URL, not request.nextUrl.clone() — NextURL re-strips the trailing
    // slash on serialization once skipTrailingSlashRedirect is set, which turns
    // this into a redirect back to the exact same (slash-less) URL forever.
    const url = new URL(`${pathname}/${request.nextUrl.search}`, request.url)
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
