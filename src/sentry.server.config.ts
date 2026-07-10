// Initializes Sentry on the server — used whenever the server handles a
// request. No-ops safely when NEXT_PUBLIC_SENTRY_DSN is unset (e.g. local
// dev, or before a Sentry project has been created).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
})
