import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { airlines } from '@/lib/schema'
import { notTrashed, isCurrentlyLive } from '@/lib/visibility'
import AirlineForm from '@/components/admin/AirlineForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EditAirlinePage({ params }: Props) {
  const { slug } = await params

  const airline = await db.query.airlines.findFirst({
    where: and(eq(airlines.slug, slug), notTrashed(airlines)),
  })
  if (!airline) notFound()

  return <AirlineForm mode="edit" initialData={airline} isLive={isCurrentlyLive(airline)} />
}
