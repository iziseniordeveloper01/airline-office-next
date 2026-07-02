const nextConfig = {
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
}

export default nextConfig