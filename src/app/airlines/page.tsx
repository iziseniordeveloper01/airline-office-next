import type { Metadata } from 'next'
import { getAllAirlines } from '@/lib/data/getAirline'

export const metadata: Metadata = {
  title: 'All Airlines | Airline Office Directory',
  description: 'Browse all airlines and find their office locations worldwide.',
}

export default async function AirlinesPage() {
  const airlines = await getAllAirlines()

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">Airlines</h1>
      <p className="text-gray-500 mb-8">{airlines.length} airlines listed</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {airlines.map((airline) => (
          <a
            key={airline.slug}
            href={`/${airline.slug}/`}
            className="flex items-center gap-4 p-4 border rounded-xl hover:border-indigo-400 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {airline.iataCode}
            </div>
            <div>
              <div className="font-medium">{airline.name}</div>
              <div className="text-xs text-gray-500">{airline.officeCount} offices</div>
            </div>
          </a>
        ))}
      </div>
    </main>
  )
}