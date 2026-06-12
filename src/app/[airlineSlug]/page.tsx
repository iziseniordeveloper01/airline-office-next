import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getAirline, getAllAirlines } from '@/lib/data/getAirline'
import { getOfficesByAirline } from '@/lib/data/getOffice'

// Next.js 15 mein params is a Promise
interface Props {
  params: Promise<{ airlineSlug: string }>
}

export async function generateStaticParams() {
  const airlines = await getAllAirlines()
  return airlines.map((a) => ({ airlineSlug: a.slug }))
}

export const revalidate = 86400

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airlineSlug } = await params
  const airline = await getAirline(airlineSlug)
  if (!airline) return { title: 'Not Found' }
  return {
    title: airline.metaTitle,
    description: airline.metaDescription,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${airlineSlug}/`,
    },
  }
}

export default async function AirlineHubPage({ params }: Props) {
  const { airlineSlug } = await params
  const [airline, offices] = await Promise.all([
    getAirline(airlineSlug),
    getOfficesByAirline(airlineSlug),
  ])

  if (!airline) notFound()

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">{airline.name}</h1>
      <p className="text-gray-500 mb-8">{offices.length} office locations</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offices.map((office) => (<a  
          
            key={office.slug}
            href={`/${office.airlineSlug}/${office.slug}/`}
            className="block p-4 border rounded-xl hover:border-indigo-400 transition-colors"
          >
            <div className="font-medium text-sm">{office.fullTitle}</div>
            <div className="text-xs text-gray-500 mt-1">
              {office.city}, {office.country}
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}