import { db } from '@/lib/db'
import { activityLog } from '@/lib/schema'

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'trashed'
  | 'restored'
  | 'deleted'
  | 'published'
  | 'unpublished'

export type ActivityEntity = 'office' | 'airline' | 'blog' | 'user' | 'settings' | 'media'

interface LogUser {
  id?: string | null
  name?: string | null
  email?: string | null
}

interface LogEntry {
  action: ActivityAction
  entityType: ActivityEntity
  entityId?: string | number | null
  entityTitle?: string | null
  href?: string | null
}

// Fire-and-forget audit write. The session user is passed in (callers already
// hold it from requireRole) to avoid a second getSession round-trip. Logging
// must NEVER break the underlying mutation, so all errors are swallowed.
export async function logActivity(user: LogUser | null | undefined, entry: LogEntry) {
  try {
    await db.insert(activityLog).values({
      userId: user?.id ?? null,
      userName: user?.name ?? user?.email ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId != null ? String(entry.entityId) : null,
      entityTitle: entry.entityTitle ?? null,
      href: entry.href ?? null,
    })
  } catch (e) {
    console.error('[activity] failed to log', entry.action, entry.entityType, e)
  }
}
