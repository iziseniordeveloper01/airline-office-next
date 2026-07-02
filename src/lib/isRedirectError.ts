// Server Actions that call redirect() throw a special error with this digest —
// when calling such an action directly from a client event handler (rather
// than via <form action={...}>), that throw must propagate, never be caught
// and reported as a failure toast.
export function isRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}
