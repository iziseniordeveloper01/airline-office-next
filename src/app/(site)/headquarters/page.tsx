import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Building2, Mail, MapPin, Phone } from 'lucide-react'
import { getAllAirlines } from '@/lib/data/getAirline'

export const metadata: Metadata = {
  title: 'Airline Headquarters Worldwide | Airline Office Directory',
  description:
    'Find headquarters addresses, phone numbers, and contact emails for airlines around the world.',
  alternates: {
    canonical: '/headquarters/',
  },
}

// Rendered at runtime, not at build: Railway's build phase can't reach the
// private mysql.railway.internal host, so any build-time DB read fails. This
// reads the airlines list per request instead of prerendering at build.
export const dynamic = 'force-dynamic'

export default async function HeadquartersPage() {
  const airlines = await getAllAirlines()
  const withHq = airlines.filter((a) => a.hqAddress || a.hqPhone || a.hqEmail)

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="bg-indigo-700 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-1">Airline Headquarters</h1>
          <p className="text-indigo-200 text-sm">
            Head office addresses and contact details for {withHq.length} airlines
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {withHq.length === 0 ? (
          <p className="text-center py-20 text-gray-400">No headquarters information available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {withHq.map((airline) => (
              <div
                key={airline.slug}
                className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4"
              >
                <Link href={`/${airline.slug}/`} className="flex items-center gap-3 group">
                  <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {airline.logo ? (
                      <Image src={airline.logo} alt={airline.name} width={40} height={40} className="object-contain" />
                    ) : (
                      <Building2 className="size-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {airline.name}
                    </p>
                    {airline.iataCode && (
                      <p className="text-xs text-gray-500">IATA: {airline.iataCode}</p>
                    )}
                  </div>
                </Link>

                <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
                  {airline.hqAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-indigo-500 mt-0.5 shrink-0" />
                      <span>{airline.hqAddress}</span>
                    </div>
                  )}
                  {airline.hqPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-indigo-500 shrink-0" />
                      <a href={`tel:${airline.hqPhone}`} className="hover:text-indigo-600 transition-colors">
                        {airline.hqPhone}
                      </a>
                    </div>
                  )}
                  {airline.hqEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-indigo-500 shrink-0" />
                      <a href={`mailto:${airline.hqEmail}`} className="hover:text-indigo-600 transition-colors break-all">
                        {airline.hqEmail}
                      </a>
                    </div>
                  )}
                </div>

                <Link
                  href={`/${airline.slug}/`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                >
                  View all {airline.name} offices →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
