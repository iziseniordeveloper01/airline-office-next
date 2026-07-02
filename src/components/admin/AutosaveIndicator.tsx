'use client'

import type { AutosaveStatus } from '@/lib/useAutosave'

const LABELS: Record<AutosaveStatus, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Autosave failed',
}

export default function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null
  return (
    <span className={`text-xs italic ${status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
      {LABELS[status]}
    </span>
  )
}
