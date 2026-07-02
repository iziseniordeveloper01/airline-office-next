import { headers } from 'next/headers'
import { auth } from '@/auth'
import { requireRole } from '@/lib/auth/requireRole'
import UsersManager, { type RowUser, type UserView } from '@/components/admin/UsersManager'
import { type Role } from '@/types'

export const metadata = { title: 'Users — Admin' }

const PAGE_SIZE = 20

// Each saved view maps to a single better-auth listUsers filter (the API allows
// only one filterField per call), so views are single-dimension presets that
// search + sort narrow within.
type ListQuery = Record<string, string | number | boolean | string[]>

function viewFilter(view: UserView): ListQuery {
  switch (view) {
    case 'admins':
      return { filterField: 'role', filterOperator: 'in', filterValue: ['admin', 'super_admin'] }
    case 'editors':
      return { filterField: 'role', filterOperator: 'eq', filterValue: 'editor' }
    case 'banned':
      return { filterField: 'banned', filterOperator: 'eq', filterValue: true }
    default:
      return {}
  }
}

interface Props {
  searchParams: Promise<{ page?: string; q?: string; view?: string; sort?: string; sortDir?: string }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await requireRole('admin')
  const viewerRole = session.user.role as Role
  const h = await headers()
  const sp = await searchParams

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const view: UserView = (['all', 'admins', 'editors', 'banned'] as const).includes(sp.view as UserView)
    ? (sp.view as UserView)
    : 'all'
  const sort = sp.sort === 'name' ? 'name' : 'createdAt'
  const sortDir = sp.sortDir === 'asc' ? 'asc' : 'desc'
  const q = sp.q?.trim() || ''

  const search: ListQuery = q
    ? { searchValue: q, searchField: q.includes('@') ? 'email' : 'name', searchOperator: 'contains' }
    : {}

  const countFor = (view: UserView) =>
    auth.api.listUsers({ headers: h, query: { ...viewFilter(view), limit: 1 } as never }).then((r) => r.total)

  const [main, allCount, adminsCount, editorsCount, bannedCount] = await Promise.all([
    auth.api.listUsers({
      headers: h,
      query: {
        ...viewFilter(view),
        ...search,
        sortBy: sort,
        sortDirection: sortDir,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      } as never,
    }),
    countFor('all'),
    countFor('admins'),
    countFor('editors'),
    countFor('banned'),
  ])

  const rows: RowUser[] = main.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as Role) ?? 'editor',
    banned: !!u.banned,
    createdAt: u.createdAt.toISOString().slice(0, 10),
  }))

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage admin panel access and roles.</p>
      </div>

      <UsersManager
        users={rows}
        total={main.total}
        page={page}
        pageSize={PAGE_SIZE}
        counts={{ all: allCount, admins: adminsCount, editors: editorsCount, banned: bannedCount }}
        query={{ view, q, sort, sortDir }}
        viewerId={session.user.id}
        viewerRole={viewerRole}
      />
    </div>
  )
}
