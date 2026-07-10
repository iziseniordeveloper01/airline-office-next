// Initializes Sentry for edge features (proxy.ts, edge routes). This runs
// locally too, not just on an edge platform — see the Sentry Next.js docs.
// No-ops safely when NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
})
