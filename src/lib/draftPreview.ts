import { cache } from 'react'
import { draftMode } from 'next/headers'
import { getCurrentUser, HIERARCHY } from '@/lib/auth/requireRole'
import type { Role } from '@/types'

// True only when Next's draft-mode cookie is set AND the requesting session
// currently holds editor+. The cookie alone never grants access — it's set by
// src/app/api/draft/route.ts after that same role check, but a leaked/stale
// cookie must not bypass auth, so every request re-verifies the live session
// here. cache() dedupes the session lookup across generateMetadata + the page
// component within one request.
export const canPreviewDrafts = cache(async (): Promise<boolean> => {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return false
  const user = await getCurrentUser()
  const role = user?.role as Role | undefined
  return !!role && HIERARCHY[role] >= HIERARCHY.editor
})
