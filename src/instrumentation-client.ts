// Initializes Sentry in the browser — runs before hydration. No-ops safely
// when NEXT_PUBLIC_SENTRY_DSN is unset.
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
