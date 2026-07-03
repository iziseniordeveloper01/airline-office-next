import type { Metadata } from 'next'
import { getAllAirlines } from '@/lib/data/getAirline'
import AirlinesList from '@/components/airlines/AirlinesList'

export const metadata: Metadata = {
  title: 'All Airlines | Airline Office Directory',
  description: 'Browse all airlines and find their office locations worldwide.',
  alternates: {
    canonical: '/airlines/',
  },
}

// Rendered at runtime, not at build: Railway's build phase can't reach the
// private mysql.railway.internal host, so any build-time DB read fails. This
// reads the airlines list per request instead of prerendering at build.
export const dynamic = 'force-dynamic'

export default async function AirlinesPage() {
  const airlines = await getAllAirlines()

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="bg-indigo-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-1">Airlines</h1>
          <p className="text-indigo-200 text-sm">{airlines.length} airlines listed</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {airlines.length === 0 ? (
          <p className="text-center py-20 text-gray-400">No airlines published yet.</p>
        ) : (
          <AirlinesList airlines={airlines} />
        )}
      </div>
    </main>
  )
}
