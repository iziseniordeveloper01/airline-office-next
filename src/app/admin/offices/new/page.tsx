import { db } from '@/lib/db'
import OfficeForm from '@/components/admin/OfficeForm'

export default async function NewOfficePage() {
  const airlines = await db.query.airlines.findMany({
    columns: { id: true, slug: true, name: true, iataCode: true },
    orderBy: (a, { asc }) => [asc(a.name)],
  })

  return <OfficeForm mode="new" airlines={airlines.map((a) => ({ ...a, iataCode: a.iataCode ?? '' }))} />
}
