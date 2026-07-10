'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Route-level error boundary for the admin panel. Uses shadcn tokens to match
// the dashboard chrome; renders inside the admin layout.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" />
      </span>
      <h1 className="mt-6 text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This screen failed to load. Retry the action; if it persists, check the server logs for
        the reference below.
      </p>
      <Button onClick={reset} className="mt-6">
        <RotateCw className="size-4" />
        Try again
      </Button>
      {error.digest && (
        <p className="mt-4 text-xs text-muted-foreground">Reference: {error.digest}</p>
      )}
    </div>
  )
}
