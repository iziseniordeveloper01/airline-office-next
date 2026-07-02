import { eq, and, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { airlines, offices, officeFaqs } from '@/lib/schema'
import { notTrashed, isCurrentlyLive } from '@/lib/visibility'
import OfficeForm from '@/components/admin/OfficeForm'

interface Props {
  params: Promise<{ airlineSlug: string; officeSlug: string }>
}

export default async function EditOfficePage({ params }: Props) {
  const { airlineSlug, officeSlug } = await params

  const airline = await db.query.airlines.findFirst({ where: eq(airlines.slug, airlineSlug) })
  if (!airline) notFound()

  const office = await db.query.offices.findFirst({
    where: and(eq(offices.airlineId, airline.id), eq(offices.slug, officeSlug), notTrashed(offices)),
  })
  if (!office) notFound()

  const faqs = await db.select().from(officeFaqs)
    .where(eq(officeFaqs.officeId, office.id))
    .orderBy(asc(officeFaqs.sortOrder))

  const allAirlines = await db.query.airlines.findMany({
    columns: { id: true, slug: true, name: true, iataCode: true },
    orderBy: (a, { asc }) => [asc(a.name)],
  })

  return (
    <OfficeForm
      mode="edit"
      initialData={{ ...office, faqs }}
      airlines={allAirlines.map((a) => ({ ...a, iataCode: a.iataCode ?? '' }))}
      isLive={isCurrentlyLive(office)}
    />
  )
}
