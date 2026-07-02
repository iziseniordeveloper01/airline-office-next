import { requireRole } from '@/lib/auth/requireRole'
import { getActivityPage } from '@/lib/data/getActivity'
import type { ActivityAction, ActivityEntity } from '@/lib/activity'
import ActivityFeed from '@/components/admin/ActivityFeed'

export const metadata = { title: 'Activity — Admin' }

const PAGE_SIZE = 30

interface Props {
  searchParams: Promise<{ page?: string; action?: string; entityType?: string }>
}

export default async function AdminActivityPage({ searchParams }: Props) {
  await requireRole('admin')
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const { rows, total } = await getActivityPage({
    page,
    pageSize: PAGE_SIZE,
    action: (sp.action as ActivityAction | undefined) ?? 'all',
    entityType: (sp.entityType as ActivityEntity | undefined) ?? 'all',
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An audit trail of every change made in the admin panel.
        </p>
      </div>

      <ActivityFeed
        rows={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        query={{ action: sp.action ?? '', entityType: sp.entityType ?? '' }}
      />
    </div>
  )
}
