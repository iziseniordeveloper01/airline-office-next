import Link from 'next/link'

interface AirlineCard {
  slug: string
  name: string
  logo: string
  officeCount: number
}

// TODO: Replace with getAllAirlines() from src/lib/data/getAirline.ts
const featuredAirlines: AirlineCard[] = [
  { slug: 'qatar-airways', name: 'Qatar Airways', logo: '/images/airlines/qatar-airways.png', officeCount: 45 },
  { slug: 'emirates', name: 'Emirates', logo: '/images/airlines/emirates.png', officeCount: 62 },
  { slug: 'air-algerie', name: 'Air Algérie', logo: '/images/airlines/air-algerie.png', officeCount: 28 },
  { slug: 'british-airways', name: 'British Airways', logo: '/images/airlines/british-airways.png', officeCount: 51 },
  { slug: 'lufthansa', name: 'Lufthansa', logo: '/images/airlines/lufthansa.png', officeCount: 58 },
  { slug: 'singapore-airlines', name: 'Singapore Airlines', logo: '/images/airlines/singapore-airlines.png', officeCount: 39 },
  { slug: 'turkish-airlines', name: 'Turkish Airlines', logo: '/images/airlines/turkish-airlines.png', officeCount: 47 },
  { slug: 'etihad-airways', name: 'Etihad Airways', logo: '/images/airlines/etihad-airways.png', officeCount: 33 },
]

export default function PopularAirlines() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold text-indigo-600">Popular Airlines</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Find Office Details for Top Airlines
          </p>
          <p className="mt-4 text-base text-gray-600">
            Browse contact information, addresses, and working hours for the world&apos;s
            leading airlines.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredAirlines.map((airline) => (
            <Link
              key={airline.slug}
              href={`/${airline.slug}/`}
              className="group flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex h-16 w-full items-center justify-center">
                <img
                  src={airline.logo}
                  alt={airline.name}
                  className="h-12 max-w-full object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
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
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-colors"
          >
            View All Airlines →
          </Link>
        </div>
      </div>
    </section>
  )
}