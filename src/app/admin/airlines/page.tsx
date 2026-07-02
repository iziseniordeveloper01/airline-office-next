import { db } from '@/lib/db'
import { airlines as airlinesTable } from '@/lib/schema'
import { notTrashed } from '@/lib/visibility'
import AirlinesTable from '@/components/admin/AirlinesTable'

export default async function AdminAirlinesPage() {
  const rows = await db.query.airlines.findMany({
    where: notTrashed(airlinesTable),
    orderBy: (a, { asc }) => [asc(a.name)],
  })

  const airlines = rows.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    iataCode: a.iataCode ?? '',
    icaoCode: a.icaoCode ?? '',
    alliance: a.alliance ?? '',
    status: a.status,
    isFeatured: !!a.isFeatured,
    updatedAt: a.updatedAt?.toISOString().slice(0, 10) ?? '',
  }))

  return <AirlinesTable airlines={airlines} />
}
