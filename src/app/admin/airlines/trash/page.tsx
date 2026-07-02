import { desc, isNotNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { airlines } from '@/lib/schema'
import AirlinesTrashTable from '@/components/admin/AirlinesTrashTable'

export default async function AirlinesTrashPage() {
  const [session, rows] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.select({
      id: airlines.id,
      slug: airlines.slug,
      name: airlines.name,
      iataCode: airlines.iataCode,
      deletedAt: airlines.deletedAt,
    })
      .from(airlines)
      .where(isNotNull(airlines.deletedAt))
      .orderBy(desc(airlines.deletedAt)),
  ])

  const trashed = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    iataCode: a.iataCode ?? '',
    deletedAt: a.deletedAt?.toISOString().slice(0, 10) ?? '',
  }))

  return <AirlinesTrashTable airlines={trashed} canManageTrash={session?.user?.role !== 'editor'} />
}
