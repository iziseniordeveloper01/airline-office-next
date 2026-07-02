import { headers } from 'next/headers'
import { auth } from '@/auth'
import { getAdminOfficesPage } from '@/lib/data/getOffice'
import OfficesTrashTable from '@/components/admin/OfficesTrashTable'

interface Props {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; sortDir?: string }>
}

export default async function OfficesTrashPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const sort = sp.sort === 'fullTitle' ? 'fullTitle' : 'updatedAt'
  const sortDir = sp.sortDir === 'asc' ? 'asc' : 'desc'

  const [session, { rows, total }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getAdminOfficesPage({ page, pageSize: 20, q: sp.q, sort, sortDir, trashed: true }),
  ])

  return (
    <OfficesTrashTable
      rows={rows.map((o) => ({ ...o, deletedAt: o.deletedAt?.toISOString() ?? null }))}
      total={total}
      page={page}
      pageSize={20}
      query={{ q: sp.q ?? '', sort, sortDir }}
      canManageTrash={session?.user?.role !== 'editor'}
    />
  )
}
