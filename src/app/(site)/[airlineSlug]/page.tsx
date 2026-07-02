import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  Building2, Calendar, Globe2, Layers, Mail, MapPin, Phone,
} from 'lucide-react'
import { getAirline } from '@/lib/data/getAirline'
import { getOfficesByAirline } from '@/lib/data/getOffice'

interface Props {
  params: Promise<{ airlineSlug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airlineSlug } = await params
  const airline = await getAirline(airlineSlug)
  if (!airline) return { title: 'Not Found' }
  const title = airline.metaTitle || `${airline.name} Offices Worldwide`
  return {
    title,
    description: airline.metaDescription || undefined,
    robots: airline.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: airline.metaDescription || undefined,
      images: airline.ogImage ? [airline.ogImage] : airline.coverImage ? [airline.coverImage] : airline.logo ? [airline.logo] : [],
    },
    alternates: {
      canonical: airline.canonicalUrl || `/${airlineSlug}/`,
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

  const socials = Object.entries(airline.socialMedia).filter(([, url]) => !!url) as [string, string][]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: airline.name,
    url: airline.website || undefined,
    logo: airline.logo || undefined,
    email: airline.email || undefined,
    telephone: airline.phone || undefined,
    sameAs: socials.map(([, url]) => url),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ── */}
      <section className="relative bg-slate-900 overflow-hidden">
        {airline.coverImage && (
          <Image
            src={airline.coverImage}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-b from-slate-900/60 via-slate-900/80 to-slate-900" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-slate-300 mb-5 font-medium">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="text-slate-400">»</span>
            <Link href="/airlines/" className="hover:text-white transition-colors">Airlines</Link>
            <span className="text-slate-400">»</span>
            <span className="text-slate-200">{airline.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 shrink-0 flex items-center justify-center shadow-lg">
              {airline.logo ? (
                <Image src={airline.logo} alt={airline.name} width={72} height={72} className="object-contain" />
              ) : (
                <Building2 className="size-8 text-slate-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{airline.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
                {airline.iataCode && <span>IATA: <strong className="text-white">{airline.iataCode}</strong></span>}
                {airline.icaoCode && <span>ICAO: <strong className="text-white">{airline.icaoCode}</strong></span>}
                <span>{offices.length} office location{offices.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── MAIN ── */}
          <main className="flex-1 min-w-0 space-y-10">
            {airline.description && (
              <section className="prose-content" dangerouslySetInnerHTML={{ __html: airline.description }} />
            )}

            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Office Locations</h2>
              {offices.length === 0 ? (
                <p className="text-gray-500">No office locations published yet for {airline.name}.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {offices.map((office) => (
                    <Link
                      key={office.slug}
                      href={`/${office.airlineSlug}/${office.slug}/`}
                      className="flex gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-[color,border-color,box-shadow]"
                    >
                      <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {office.heroImage || office.ogImage ? (
                          <Image
                            src={(office.heroImage || office.ogImage) as string}
                            alt={office.fullTitle}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <MapPin className="size-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900">{office.fullTitle}</div>
                        <div className="text-xs text-gray-500 mt-1">{office.city}, {office.country}</div>
                        {office.isHeadquarters && (
                          <span className="inline-block mt-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            Headquarters
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6 lg:sticky lg:top-28">
            {(airline.headquarters.address || airline.headquarters.phone || airline.headquarters.email) && (
              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h3 className="font-bold text-sm">Headquarters</h3>
                </div>
                <div className="p-4 space-y-3 text-sm text-slate-700">
                  {airline.headquarters.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-indigo-500 mt-0.5 shrink-0" />
                      <span>{airline.headquarters.address}</span>
                    </div>
                  )}
                  {airline.headquarters.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-indigo-500 shrink-0" />
                      <a href={`tel:${airline.headquarters.phone}`} className="text-indigo-600 hover:underline">
                        {airline.headquarters.phone}
                      </a>
                    </div>
                  )}
                  {airline.headquarters.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-indigo-500 shrink-0" />
                      <span className="break-all">{airline.headquarters.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-indigo-600 text-white px-4 py-3">
                <h3 className="font-bold text-sm">Airline Info</h3>
              </div>
              <div className="p-4 space-y-3 text-sm text-slate-700">
                {!!airline.foundedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-indigo-500 shrink-0" />
                    <span>Founded {airline.foundedYear}</span>
                  </div>
                )}
                {airline.alliance && (
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-indigo-500 shrink-0" />
                    <span className="capitalize">{airline.alliance.replace(/-/g, ' ')}</span>
                  </div>
                )}
                {airline.website && (
                  <div className="flex items-center gap-2">
                    <Globe2 className="size-4 text-indigo-500 shrink-0" />
                    <a href={airline.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                      Official Website
                    </a>
                  </div>
                )}
                {airline.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-4 text-indigo-500 shrink-0" />
                    <a href={`tel:${airline.phone}`} className="text-indigo-600 hover:underline">{airline.phone}</a>
                  </div>
                )}
                {airline.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-4 text-indigo-500 shrink-0" />
                    <span className="break-all">{airline.email}</span>
                  </div>
                )}
                {socials.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {socials.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors capitalize"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
