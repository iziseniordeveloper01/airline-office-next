import Link from 'next/link'
import Image from 'next/image'
import { Building2 } from 'lucide-react'
import { getAllAirlines } from '@/lib/data/getAirline'

export default async function PopularAirlines() {
  const airlines = await getAllAirlines()
  const featured = airlines.filter((a) => a.isFeatured).slice(0, 8)
  const displayAirlines = featured.length > 0 ? featured : airlines.slice(0, 8)

  if (displayAirlines.length === 0) return null

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-base font-semibold text-blue-800">Popular Airlines</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Find Office Details for Top Airlines
          </h2>
          <p className="mt-4 text-base text-gray-600">
            Browse contact information, addresses, and working hours for the world&apos;s
            leading airlines.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {displayAirlines.map((airline) => (
            <Link
              key={airline.slug}
              href={`/${airline.slug}/`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-[color,border-color,box-shadow] hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex h-16 w-full items-center justify-center">
                {airline.logo ? (
                  <Image
                    src={airline.logo}
                    alt={airline.name}
                    width={120}
                    height={48}
                    className="h-12 max-w-full object-contain"
                  />
                ) : (
                  <Building2 className="size-8 text-gray-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">
                  {airline.name}
                </p>
                <p className="text-xs text-gray-500">{airline.officeCount} Offices</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/airlines"
            className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            View All Airlines →
          </Link>
        </div>
      </div>
    </section>
  )
}
   