import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin } from 'lucide-react'
import { getAllAirlines } from '@/lib/data/getAirline'

export default async function Headquarters() {
  const airlines = await getAllAirlines()
  const withHq = airlines.filter((a) => a.hqAddress).slice(0, 6)

  if (withHq.length === 0) return null

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-base font-semibold text-indigo-600">Headquarters</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Airline Head Office Addresses
          </h2>
          <p className="mt-4 text-base text-gray-600">
            Looking for the corporate headquarters instead of a local office? Find addresses,
            phone numbers, and emails for airline head offices worldwide.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withHq.map((airline) => (
            <Link
              key={airline.slug}
              href={`/${airline.slug}/`}
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-[color,border-color,box-shadow] hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 border border-gray-100 overflow-hidden">
                {airline.logo ? (
                  <Image src={airline.logo} alt={airline.name} width={32} height={32} className="object-contain" />
                ) : (
                  <Building2 className="size-4 text-gray-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {airline.name}
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-500 leading-relaxed">
                  <MapPin className="size-3.5 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{airline.hqAddress}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/headquarters"
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
          >
            View All Headquarters →
          </Link>
        </div>
      </div>
    </section>
  )
}
