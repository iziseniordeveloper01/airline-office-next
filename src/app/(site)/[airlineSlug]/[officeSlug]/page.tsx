import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe2,
  Luggage,
  Mail,
  MapPin,
  MapPinned,
  Navigation,
  Phone,
  PlaneTakeoff,
  Ticket,
} from 'lucide-react'
import { getOffice, getOfficesByAirline, getAllOfficePaths } from '@/lib/data/getOffice'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ airlineSlug: string; officeSlug: string }>
}

// ─── Static Generation ───────────────────────────────────────────────────────

export async function generateStaticParams() {
  const paths = await getAllOfficePaths()
  return paths.slice(0, 500).map((p) => ({
    airlineSlug: p.airlineSlug,
    officeSlug: p.slug,
  }))
}

export const revalidate = 86400
// A scheduled office that's already due is excluded from generateStaticParams (it
// wasn't visible yet at the last build/regenerate), so it must render on-demand the
// first time its URL is requested — dynamicParams must stay true for that to work.
export const dynamicParams = true

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airlineSlug, officeSlug } = await params
  const office = await getOffice(airlineSlug, officeSlug)
  if (!office) return { title: 'Not Found' }
  const title = office.metaTitle || office.fullTitle
  return {
    title,
    description: office.metaDescription || undefined,
    robots: office.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: office.metaDescription || undefined,
      images: office.ogImage ? [office.ogImage] : [],
      type: 'article',
    },
    alternates: {
      canonical: office.canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/${airlineSlug}/${officeSlug}/`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function OfficePage({ params }: Props) {
  const { airlineSlug, officeSlug } = await params

  const [office, siblingOffices] = await Promise.all([
    getOffice(airlineSlug, officeSlug),
    getOfficesByAirline(airlineSlug),
  ])

  // getOffice() already applies isPubliclyVisible() at the query level — a returned
  // office is guaranteed visible, including a scheduled-but-due one whose `status`
  // column still literally says 'scheduled'. Re-checking office.isPublished here
  // would wrongly 404 that exact on-read case.
  if (!office) notFound()

  const relatedOffices = siblingOffices.filter((o) => o.slug !== officeSlug).slice(0, 5)

  const heroBg = office.heroImage || office.ogImage || '/images/offices/default-hero.jpg'
  const location = [office.city, office.country].filter(Boolean).join(', ')

  const directionsUrl =
    office.mapLat && office.mapLng
      ? `https://www.google.com/maps/search/?api=1&query=${office.mapLat},${office.mapLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [office.address, office.city, office.country].filter(Boolean).join(', ')
        )}`

  const quickLinks = [
    office.onlineCheckin && { href: office.onlineCheckin, label: 'Online Check-in', icon: BadgeCheck },
    office.flightStatus && { href: office.flightStatus, label: 'Flight Status', icon: PlaneTakeoff },
    office.baggageInfo && { href: office.baggageInfo, label: 'Baggage Info', icon: Luggage },
  ].filter(Boolean) as { href: string; label: string; icon: typeof BadgeCheck }[]

  const socials = Object.entries(office.socialMedia).filter(([, url]) => !!url) as [string, string][]

  // Schema.org LocalBusiness (+ geo when coordinates are known)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: office.fullTitle,
    address: {
      '@type': 'PostalAddress',
      streetAddress: office.address,
      addressLocality: office.city,
      addressRegion: office.region || undefined,
      addressCountry: office.countryCode,
    },
    ...(office.mapLat && office.mapLng
      ? { geo: { '@type': 'GeoCoordinates', latitude: office.mapLat, longitude: office.mapLng } }
      : {}),
    telephone: office.phone,
    email: office.email,
    openingHours: `${office.workingDays} ${office.workingHours}`,
    url: office.website,
    image: office.heroImage || office.ogImage || undefined,
  }

  const faqJsonLd =
    office.faqs?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: office.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        }
      : null

  return (
    <>
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative isolate flex min-h-104 items-center overflow-hidden bg-slate-900">
        <Image src={heroBg} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-linear-to-r from-slate-900/95 via-slate-900/80 to-slate-900/50" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 lg:px-8">
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            {/* Left: title + info + CTA */}
            <div className="flex-1 text-white">
              {/* Breadcrumb */}
              <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-300">
                <Link href="/" className="transition-colors hover:text-white">Home</Link>
                <ChevronRight className="size-3.5 text-slate-500" />
                <Link href={`/${office.airlineSlug}/`} className="transition-colors hover:text-white">{office.airlineName}</Link>
                <ChevronRight className="size-3.5 text-slate-500" />
                <span className="text-slate-200">{office.city}</span>
              </nav>

              {office.isHeadquarters && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 ring-1 ring-inset ring-indigo-400/30">
                  <BadgeCheck className="size-3.5" /> Headquarters
                </span>
              )}

              <h1 className="text-3xl font-bold leading-tight md:text-4xl">{office.fullTitle}</h1>
              {location && (
                <p className="mt-2 flex items-center gap-1.5 text-slate-300">
                  <MapPin className="size-4 text-indigo-300" />
                  {location}
                  {office.region && <span className="text-slate-400">· {office.region}</span>}
                </p>
              )}

              {/* Quick info */}
              <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
                {office.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-indigo-300" />
                    <span>{office.address}</span>
                  </li>
                )}
                {office.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-indigo-300" />
                    <a href={`tel:${office.phone}`} className="transition-colors hover:text-white">{office.phone}</a>
                  </li>
                )}
                {(office.workingDays || office.workingHours) && (
                  <li className="flex items-center gap-2.5">
                    <Clock className="size-4 shrink-0 text-indigo-300" />
                    <span>{[office.workingDays, office.workingHours].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {office.ctaPhone && (
                  <a
                    href={`tel:${office.ctaPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-green-500/20 transition-colors hover:bg-green-600"
                  >
                    <Phone className="size-4" />
                    Call Now: {office.ctaPhone}
                  </a>
                )}
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <Navigation className="size-4" />
                  Get Directions
                </a>
              </div>
            </div>

            {/* Right: map card */}
            {office.mapEmbedUrl && (
              <div className="w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl lg:w-80 xl:w-96">
                <iframe
                  src={office.mapEmbedUrl}
                  title={`Map for ${office.fullTitle}`}
                  width="100%"
                  height="300"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ════════════════════ QUICK FACTS STRIP ════════════════════ */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden bg-gray-100 lg:grid-cols-4">
            <QuickFact icon={MapPin} label="Location" value={location || office.address || '—'} />
            <QuickFact icon={Phone} label="Phone" value={office.phone || office.ctaPhone || '—'} href={office.phone ? `tel:${office.phone}` : undefined} />
            <QuickFact icon={Clock} label="Working Hours" value={office.workingHours || office.workingDays || '—'} />
            <QuickFact
              icon={Globe2}
              label="Website"
              value={office.website ? 'Official Website' : '—'}
              href={office.website || undefined}
              external
            />
          </div>
        </div>
      </div>

      {/* ════════════════════ BODY ════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-col items-start gap-10 lg:flex-row">
          {/* ── MAIN ── */}
          <main className="min-w-0 flex-1 space-y-10">
            {office.content && (
              <section className="prose-content" dangerouslySetInnerHTML={{ __html: office.content }} />
            )}

            {/* Quick links (online check-in / flight status / baggage) */}
            {quickLinks.length > 0 && (
              <section>
                <SectionHeading>Helpful Links</SectionHeading>
                <div className="grid gap-3 sm:grid-cols-3">
                  {quickLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-[border-color,box-shadow] hover:border-indigo-300 hover:shadow-sm"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <link.icon className="size-5" />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-indigo-600">{link.label}</span>
                      <ExternalLink className="size-4 text-gray-300 group-hover:text-indigo-400" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs */}
            {office.faqs?.length > 0 && (
              <section>
                <SectionHeading>Frequently Asked Questions</SectionHeading>
                <div className="space-y-2.5">
                  {office.faqs.map((faq, i) => (
                    <details key={i} className="group rounded-xl border border-gray-200 bg-white open:shadow-sm">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none">
                        <span className="text-sm font-semibold text-slate-800">{faq.question}</span>
                        <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-90" />
                      </summary>
                      <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* ── SIDEBAR ── */}
          <aside className="w-full shrink-0 space-y-6 lg:sticky lg:top-28 lg:w-72 xl:w-80">
            {/* Quick contact */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 bg-indigo-600 px-4 py-3 text-white">
                <MapPinned className="size-4" />
                <h3 className="text-sm font-bold">Quick Contact</h3>
              </div>
              <div className="space-y-3 p-4 text-sm text-slate-700">
                {office.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                    <span>{office.address}</span>
                  </div>
                )}
                {office.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-indigo-500" />
                    <a href={`tel:${office.phone}`} className="text-indigo-600 hover:underline">{office.phone}</a>
                  </div>
                )}
                {office.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="size-4 shrink-0 text-indigo-500" />
                    <a href={`mailto:${office.email}`} className="break-all text-indigo-600 hover:underline">{office.email}</a>
                  </div>
                )}
                {(office.workingDays || office.workingHours) && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 size-4 shrink-0 text-indigo-500" />
                    <span>{[office.workingDays, office.workingHours].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {office.ctaPhone && (
                  <a
                    href={`tel:${office.ctaPhone}`}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-green-600"
                  >
                    <Phone className="size-4" />
                    Call Now: {office.ctaPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Related offices */}
            {relatedOffices.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 bg-slate-800 px-4 py-3 text-white">
                  <Building2 className="size-4" />
                  <h3 className="text-sm font-bold">{office.airlineName} Locations</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {relatedOffices.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/${related.airlineSlug}/${related.slug}/`}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {related.heroImage || related.ogImage ? (
                          <Image src={(related.heroImage || related.ogImage) as string} alt={related.fullTitle} fill className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <MapPin className="size-4 text-gray-400" />
                          </span>
                        )}
                      </div>
                      <span className="text-sm leading-tight text-slate-700 transition-colors group-hover:text-indigo-600">
                        {related.fullTitle}
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/${office.airlineSlug}/`}
                  className="flex items-center gap-1 border-t border-gray-100 px-4 py-3 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                >
                  View all {office.airlineName} offices
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            )}

            {/* Airline / socials */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 bg-slate-100 px-4 py-3 text-slate-700">
                <PlaneTakeoff className="size-4 text-indigo-500" />
                <h3 className="text-sm font-bold">About {office.airlineName}</h3>
              </div>
              <div className="space-y-3 p-4 text-sm text-slate-700">
                <Link href={`/${office.airlineSlug}/`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                  <Ticket className="size-4 text-indigo-500" />
                  Airline overview &amp; all offices
                </Link>
                {office.website && (
                  <a href={office.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                    <Globe2 className="size-4 text-indigo-500" />
                    Official website
                  </a>
                )}
                {socials.length > 0 && (
                  <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                    {socials.map(([platform, url]) => (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-600 transition-colors hover:bg-indigo-100"
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

      {/* ════════════════════ STICKY MOBILE CALL BAR ════════════════════ */}
      {office.ctaPhone && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50 bg-green-500 pb-[env(safe-area-inset-bottom)] shadow-2xl lg:hidden">
            <a
              href={`tel:${office.ctaPhone}`}
              className="flex w-full items-center justify-center gap-3 py-3.5 text-base font-bold tracking-wide text-white transition-colors hover:bg-green-600"
            >
              <Phone className="size-5" />
              CALL NOW: {office.ctaPhone}
            </a>
          </div>
          <div className="h-16 lg:hidden" />
        </>
      )}
    </>
  )
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-2xl font-bold text-slate-800">{children}</h2>
}

function QuickFact({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof MapPin
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  const cls = 'flex items-center gap-3 bg-white px-2 py-5 transition-colors lg:px-4'
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-slate-800">{value}</p>
      </div>
    </>
  )
  if (!href) return <div className={cls}>{inner}</div>
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`${cls} hover:bg-gray-50`}
    >
      {inner}
    </a>
  )
}
