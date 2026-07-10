import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  Building2, Calendar, Globe2, Layers, Mail, MapPin, Navigation, Phone,
} from 'lucide-react'
import { getAirline, getAirlineForPreview } from '@/lib/data/getAirline'
import { getOfficesByAirline } from '@/lib/data/getOffice'
import { canPreviewDrafts } from '@/lib/draftPreview'
import { getRedirectTarget } from '@/lib/redirects'
import { jsonLd as toJsonLd, telHref } from '@/lib/utils'
import Breadcrumb from '@/components/layout/Breadcrumb'
import SidebarCard from '@/components/layout/SidebarCard'

interface Props {
  params: Promise<{ airlineSlug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airlineSlug } = await params
  let airline = await getAirline(airlineSlug)
  if (!airline && (await canPreviewDrafts())) airline = await getAirlineForPreview(airlineSlug)
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

  // Checked before the content lookup, not just on a 404 — an admin-added
  // redirect must win even while the airline it points away from is still live.
  const target = await getRedirectTarget(`/${airlineSlug}`)
  if (target) permanentRedirect(target)

  const [airlineResult, offices] = await Promise.all([
    getAirline(airlineSlug),
    getOfficesByAirline(airlineSlug),
  ])

  const airline = airlineResult ?? ((await canPreviewDrafts()) ? await getAirlineForPreview(airlineSlug) : null)
  if (!airline) {
    notFound()
  }

  const socials = Object.entries(airline.socialMedia).filter(([, url]) => !!url) as [string, string][]
  const callPhone = airline.phone || airline.headquarters.phone
  const tel = telHref(callPhone)

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
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />

      {/* ── HERO ── */}
      <section className="relative isolate overflow-hidden bg-blue-950">
        {airline.coverImage && (
          <Image src={airline.coverImage} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-blue-950/95 via-blue-950/85 to-blue-900/60" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <Breadcrumb
            tone="dark"
            className="mb-6"
            items={[
              { label: 'Home', href: '/' },
              { label: 'Airlines', href: '/airlines/' },
              { label: airline.name },
            ]}
          />

          <div className="flex flex-wrap items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white p-2 shrink-0 flex items-center justify-center shadow-lg">
              {airline.logo ? (
                <Image src={airline.logo} alt={airline.name} width={72} height={72} className="object-contain" />
              ) : (
                <Building2 className="size-8 text-gray-400" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{airline.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-100">
                {airline.iataCode && <span>IATA: <strong className="text-white">{airline.iataCode}</strong></span>}
                {airline.icaoCode && <span>ICAO: <strong className="text-white">{airline.icaoCode}</strong></span>}
                <span>{offices.length} office location{offices.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {callPhone && (
              <a
                href={tel}
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-600/25 transition-colors hover:bg-orange-700"
              >
                <Phone className="size-4" />
                Call Now: {callPhone}
              </a>
            )}
            {airline.website && (
              <a
                href={airline.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Globe2 className="size-4" />
                Official Website
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── MAIN ── */}
          <main className="flex-1 min-w-0 space-y-10">
            {airline.description && (
              <section className="prose-content" dangerouslySetInnerHTML={{ __html: airline.description }} />
            )}

            <section>
              <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-gray-900">
                <span aria-hidden="true" className="h-6 w-1.5 rounded-full bg-blue-800" />
                Office Locations
              </h2>
              {offices.length === 0 ? (
                <p className="text-gray-500">No office locations published yet for {airline.name}.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {offices.map((office) => (
                    <Link
                      key={office.slug}
                      href={`/${office.airlineSlug}/${office.slug}/`}
                      className="group flex gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:border-blue-300 hover:shadow-sm transition-[color,border-color,box-shadow]"
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
                        <div className="font-medium text-sm text-gray-900 group-hover:text-blue-800 transition-colors">{office.fullTitle}</div>
                        <div className="text-xs text-gray-500 mt-1">{office.city}, {office.country}</div>
                        {office.isHeadquarters && (
                          <span className="inline-block mt-1.5 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full">
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
              <SidebarCard icon={MapPin} title="Headquarters">
                <div className="space-y-3 text-sm text-gray-700">
                  {airline.headquarters.address && (
                    <div className="flex items-start gap-2.5">
                      <MapPin className="size-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{airline.headquarters.address}</span>
                    </div>
                  )}
                  {airline.headquarters.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="size-4 text-blue-600 shrink-0" />
                      <a href={`tel:${airline.headquarters.phone}`} className="text-blue-700 hover:underline">
                        {airline.headquarters.phone}
                      </a>
                    </div>
                  )}
                  {airline.headquarters.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="size-4 text-blue-600 shrink-0" />
                      <span className="break-all">{airline.headquarters.email}</span>
                    </div>
                  )}
                </div>
              </SidebarCard>
            )}

            <SidebarCard icon={Navigation} title="Airline Info">
              <div className="space-y-3 text-sm text-gray-700">
                {!!airline.foundedYear && (
                  <div className="flex items-center gap-2.5">
                    <Calendar className="size-4 text-blue-600 shrink-0" />
                    <span>Founded {airline.foundedYear}</span>
                  </div>
                )}
                {airline.alliance && (
                  <div className="flex items-center gap-2.5">
                    <Layers className="size-4 text-blue-600 shrink-0" />
                    <span className="capitalize">{airline.alliance.replace(/-/g, ' ')}</span>
                  </div>
                )}
                {airline.website && (
                  <div className="flex items-center gap-2.5">
                    <Globe2 className="size-4 text-blue-600 shrink-0" />
                    <a href={airline.website} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">
                      Official Website
                    </a>
                  </div>
                )}
                {airline.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 text-blue-600 shrink-0" />
                    <a href={`tel:${airline.phone}`} className="text-blue-700 hover:underline">{airline.phone}</a>
                  </div>
                )}
                {airline.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="size-4 text-blue-600 shrink-0" />
                    <span className="break-all">{airline.email}</span>
                  </div>
                )}
                {socials.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {socials.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors capitalize"
                      >
                        {platform}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </>
  )
}
