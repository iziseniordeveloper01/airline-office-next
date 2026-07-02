import { db } from '@/lib/db'
import { airlines } from '@/lib/schema'
import { getAdminOfficesPage } from '@/lib/data/getOffice'
import OfficesTable from '@/components/admin/OfficesTable'

interface Props {
  searchParams: Promise<{
    page?: string
    q?: string
    airline?: string
    status?: string
    sort?: string
    sortDir?: string
  }>
}

export default async function AdminOfficesPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const status = (sp.status as 'draft' | 'published' | 'scheduled' | 'all' | undefined) ?? 'all'
  const sort = sp.sort === 'fullTitle' ? 'fullTitle' : 'updatedAt'
  const sortDir = sp.sortDir === 'asc' ? 'asc' : 'desc'

  const [{ rows, total }, airlineRows] = await Promise.all([
    getAdminOfficesPage({
      page,
      pageSize: 20,
      q: sp.q,
      airlineSlug: sp.airline,
      status,
      sort,
      sortDir,
    }),
    db.select({ slug: airlines.slug, name: airlines.name }).from(airlines).orderBy(airlines.name),
  ])

  return (
    <OfficesTable
      rows={rows.map((o) => ({ ...o, updatedAt: o.updatedAt?.toISOString() ?? null }))}
      total={total}
      page={page}
      pageSize={20}
      airlines={airlineRows}
      query={{ q: sp.q ?? '', airline: sp.airline ?? '', status, sort, sortDir }}
    />
  )
}
