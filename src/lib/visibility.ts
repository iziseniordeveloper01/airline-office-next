import { and, eq, isNull, lte, or, type Column } from 'drizzle-orm'

interface VisibilityColumns {
  status: Column
  scheduledAt: Column
  deletedAt: Column
}

// `now` is always passed explicitly (defaulting to `new Date()`) rather than using
// MySQL's NOW() — keeps the SQL-side check and the JS-side isCurrentlyLive() check
// comparing against the exact same instant, independent of the DB session's timezone.
export function isPubliclyVisible(table: VisibilityColumns, now: Date = new Date()) {
  return and(
    isNull(table.deletedAt),
    or(
      eq(table.status, 'published'),
      and(eq(table.status, 'scheduled'), lte(table.scheduledAt, now))
    )
  )
}

export function notTrashed(table: { deletedAt: Column }) {
  return isNull(table.deletedAt)
}

// Plain-object version of the same predicate, for a row already fetched (e.g. on
// the admin edit page, to decide whether to lock the slug or buffer an autosave).
export function isCurrentlyLive(
  row: { status: string; scheduledAt: Date | null },
  now: Date = new Date()
): boolean {
  if (row.status === 'published') return true
  if (row.status === 'scheduled' && row.scheduledAt) return row.scheduledAt <= now
  return false
}
