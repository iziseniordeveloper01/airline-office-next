import type { NextConfig } from 'next'

// Behind a reverse proxy (Railway, Render, Fly, a VPS Nginx, a custom domain, or
// Cloudflare in front) the browser's `origin` host can differ from the
// `x-forwarded-host` the proxy injects. Next 16 treats that mismatch as a CSRF
// attack and aborts every Server Action with HTTP 500 ("... does not match
// `origin` header ... Aborting the action."), which breaks every admin
// create/update form while GET reads keep working. Listing the public host(s)
// the app is actually served on tells Next these requests are safe.
//
// Driven entirely by env so the same build deploys to any host unchanged — set
// these in your hosting provider's dashboard, no code edit or rebuild needed:
//   NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BASE_URL / BETTER_AUTH_URL  → your domain
//   SERVER_ACTIONS_ALLOWED_ORIGINS → optional extra hosts, comma-separated,
//     e.g. "myapp.up.railway.app,www.mysite.com"
const allowedOrigins = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.NEXT_PUBLIC_BASE_URL,
      process.env.BETTER_AUTH_URL,
      ...(process.env.SERVER_ACTIONS_ALLOWED_ORIGINS?.split(',') ?? []),
    ]
      .map((v) => v?.trim())
      .filter((v): v is string => !!v)
      // Accept either full URLs ("https://host") or bare hosts ("host").
      .map((v) => {
        try {
          return v.includes('://') ? new URL(v).host : v
        } catch {
          return v
        }
      })
  )
)

const nextConfig: NextConfig = {
  // All images are served same-origin from /api/images/[id] (uploaded into MySQL via
  // the admin image pipeline) — next/image never needs to fetch a third-party host.
  images: {
    remotePatterns: [],
  },
  trailingSlash: true,
  // Next's automatic trailingSlash redirect 308s /api/* requests too, but route
  // handlers (especially catch-all ones like Better Auth's) never resolve the
  // trailing-slash variant — every API call dead-ends in a 404. Disabled here;
  // proxy.ts re-implements the redirect for normal pages and excludes /api/*.
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
}

export default nextConfig
