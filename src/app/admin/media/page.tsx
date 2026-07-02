import { requireRole } from '@/lib/auth/requireRole'
import { getMediaPage } from '@/lib/data/getMedia'
import MediaLibrary from '@/components/admin/MediaLibrary'
import { type Role } from '@/types'

export const metadata = { title: 'Media — Admin' }

const PAGE_SIZE = 24

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>
}

export default async function AdminMediaPage({ searchParams }: Props) {
  const session = await requireRole('editor')
  const role = session.user.role as Role
  const canDelete = role === 'admin' || role === 'super_admin'

  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const { rows, total } = await getMediaPage({ page, pageSize: PAGE_SIZE, q: sp.q })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Media Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse, upload, and manage images used across the site.
        </p>
      </div>

      <MediaLibrary
        rows={rows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        query={{ q: sp.q ?? '' }}
        canDelete={canDelete}
      />
    </div>
  )
}
