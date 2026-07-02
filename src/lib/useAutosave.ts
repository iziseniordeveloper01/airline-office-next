'use client'

import { useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Debounced autosave for admin content forms. `data` and `save` are read via refs
// (updated every render) so the effect's own dependency array only needs to react
// to an actual content change (`key`) — not to `save` being a fresh closure each render.
export function useAutosave<T>(
  data: T,
  save: (data: T) => Promise<unknown>,
  enabled: boolean,
  delay = 2500
): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const dataRef = useRef(data)
  const saveRef = useRef(save)
  const key = JSON.stringify(data)

  // Ref mutations must happen in an effect, not during render — keeps these two
  // always current without making the debounce effect below re-fire on every render.
  useEffect(() => {
    dataRef.current = data
    saveRef.current = save
  }, [data, save])

  useEffect(() => {
    if (!enabled) return

    const timer = setTimeout(async () => {
      setStatus('saving')
      try {
        await saveRef.current(dataRef.current)
        setStatus('saved')
      } catch {
        setStatus('error')
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [key, enabled, delay])

  return status
}
