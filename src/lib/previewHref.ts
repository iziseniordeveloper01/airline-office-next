// Live content links straight to its public URL; anything else (draft, or a
// future-dated schedule) 404s there, so it routes through /api/draft instead,
// which role-checks the session, enables Next's draft-mode cookie, then
// redirects to the real page — see src/app/api/draft/route.ts.
export function airlinePreviewHref(status: string, slug: string): string {
  return status === 'published'
    ? `/${slug}/`
    : `/api/draft?type=airline&slug=${encodeURIComponent(slug)}`
}

export function officePreviewHref(status: string, airlineSlug: string, slug: string): string {
  return status === 'published'
    ? `/${airlineSlug}/${slug}/`
    : `/api/draft?type=office&airlineSlug=${encodeURIComponent(airlineSlug)}&slug=${encodeURIComponent(slug)}`
}

export function blogPreviewHref(status: string, slug: string): string {
  return status === 'published'
    ? `/blog/${slug}/`
    : `/api/draft?type=blog&slug=${encodeURIComponent(slug)}`
}
