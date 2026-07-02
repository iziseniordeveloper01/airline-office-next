import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { activityLog } from '@/lib/schema'
import type { ActivityAction, ActivityEntity } from '@/lib/activity'

export interface ActivityRow {
  id: number
  userId: string | null
  userName: string | null
  action: string
  entityType: string
  entityId: string | null
  entityTitle: string | null
  href: string | null
  createdAt: string | null
}

export interface ActivityPageParams {
  page?: number
  pageSize?: number
  action?: ActivityAction | 'all'
  entityType?: ActivityEntity | 'all'
}

export async function getActivityPage(
  params: ActivityPageParams
): Promise<{ rows: ActivityRow[]; total: number }> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 30))

  const conditions = [
    params.action && params.action !== 'all' ? eq(activityLog.action, params.action) : undefined,
    params.entityType && params.entityType !== 'all' ? eq(activityLog.entityType, params.entityType) : undefined,
  ].filter((c): c is SQL => c !== undefined)

  const where = conditions.length ? and(...conditions) : undefined

  const [rows, [{ count }]] = await Promise.all([
    db.select()
      .from(activityLog)
      .where(where)
      .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(activityLog).where(where),
  ])

  return {
    rows: rows.map((r) => ({ ...r, createdAt: r.createdAt?.toISOString() ?? null })),
    total: Number(count),
  }
}

// Compact feed for the profile page — a user's own most recent actions.
export async function getRecentActivityByUser(userId: string, limit = 8): Promise<ActivityRow[]> {
  const rows = await db.select()
    .from(activityLog)
    .where(eq(activityLog.userId, userId))
    .orderBy(desc(activityLog.createdAt), desc(activityLog.id))
    .limit(limit)

  return rows.map((r) => ({ ...r, createdAt: r.createdAt?.toISOString() ?? null }))
}
