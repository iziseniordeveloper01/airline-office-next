import { notFound, permanentRedirect } from 'next/navigation'
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
import { getOffice, getOfficeForPreview, getOfficesByAirline } from '@/lib/data/getOffice'
import { canPreviewDrafts } from '@/lib/draftPreview'
import { getRedirectTarget } from '@/lib/redirects'
import { jsonLd as toJsonLd } from '@/lib/utils'
import Breadcrumb from '@/components/layout/Breadcrumb'
import SidebarCard from '@/components/layout/SidebarCard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ airlineSlug: string; officeSlug: string }>
}

// ─── Static Generation ───────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airlineSlug, officeSlug } = await params
  let office = await getOffice(airlineSlug, officeSlug)
  if (!office && (await canPreviewDrafts())) office = await getOfficeForPreview(airlineSlug, officeSlug)
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

  const [officeResult, siblingOffices] = await Promise.all([
    getOffice(airlineSlug, officeSlug),
    getOfficesByAirline(airlineSlug),
  ])

  // getOffice() already applies isPubliclyVisible() at the query level — a returned
  // office is guaranteed visible, including a scheduled-but-due one whose `status`
  // column still literally says 'scheduled'. Re-checking office.isPublished here
  // would wrongly 404 that exact on-read case.
  const office = officeResult ?? ((await canPreviewDrafts()) ? await getOfficeForPreview(airlineSlug, officeSlug) : null)
  if (!office) {
    const target = await getRedirectTarget(`/${airlineSlug}/${officeSlug}`)
    if (target) permanentRedirect(target)
    notFound()
  }

  const relatedOffices = siblingOffices.filter((o) => o.slug !== officeSlug).slice(0, 5)

  // No file fallback here — public/images/offices/ is empty, so a missing-image
  // office would render a broken <img>. The hero section already has a navy
  // background + gradient overlay that reads fine with no photo at all.
  const heroBg = office.heroImage || office.ogImage
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />
      )}

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="relative isolate flex min-h-104 items-center overflow-hidden bg-blue-950">
        {heroBg && <Image src={heroBg} alt="" fill priority sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-linear-to-r from-blue-950/95 via-blue-950/80 to-blue-900/50" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 pb-20 lg:px-8">
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            {/* Left: title + info + CTA */}
            <div className="flex-1 text-white">
              {/* Breadcrumb */}
              <Breadcrumb
                tone="dark"
                className="mb-5"
                items={[
                  { label: 'Home', href: '/' },
                  { label: office.airlineName, href: `/${office.airlineSlug}/` },
                  { label: office.city },
                ]}
              />

              {office.isHeadquarters && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300 ring-1 ring-inset ring-sky-400/30">
                  <BadgeCheck className="size-3.5" /> Headquarters
                </span>
              )}

              <h1 className="text-3xl font-bold leading-tight md:text-4xl">{office.fullTitle}</h1>
              {location && (
                <p className="mt-2 flex items-center gap-1.5 text-blue-100">
                  <MapPin className="size-4 text-sky-400" />
                  {location}
                  {office.region && <span className="text-blue-300">· {office.region}</span>}
                </p>
              )}

              {/* Quick info */}
              <ul className="mt-6 space-y-2.5 text-sm text-blue-50">
                {office.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-sky-400" />
                    <span>{office.address}</span>
                  </li>
                )}
                {office.phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-sky-400" />
                    <a href={`tel:${office.phone}`} className="transition-colors hover:text-white">{office.phone}</a>
                  </li>
                )}
                {(office.workingDays || office.workingHours) && (
                  <li className="flex items-center gap-2.5">
                    <Clock className="size-4 shrink-0 text-sky-400" />
                    <span>{[office.workingDays, office.workingHours].filter(Boolean).join(', ')}</span>
                  </li>
                )}
              </ul>

              {/* CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {office.ctaPhone && (
                  <a
                    href={`tel:${office.ctaPhone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-orange-600/25 transition-colors hover:bg-orange-700"
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
              <div className="w-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-2xl lg:w-80 xl:w-96">
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

      {/* ════════════════════ QUICK FACTS — floating card ════════════════════ */}
      <div className="relative z-20 mx-auto -mt-10 max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-lg lg:grid-cols-4">
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

      {/* ════════════════════ BODY ════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
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
                      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-sm"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <link.icon className="size-5" />
                      </span>
                      <span className="flex-1 text-sm font-semibold text-gray-800 group-hover:text-blue-800">{link.label}</span>
                      <ExternalLink className="size-4 text-gray-300 group-hover:text-blue-400" />
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
                    <details key={i} className="group rounded-xl border border-gray-200 bg-white open:border-blue-200 open:shadow-sm">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none">
                        <span className="text-sm font-semibold text-gray-800 group-open:text-blue-900">{faq.question}</span>
                        <ChevronRight className="size-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-90 group-open:text-blue-600" />
                      </summary>
                      <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
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
            <SidebarCard icon={MapPinned} title="Quick Contact">
              <div className="space-y-3 text-sm text-gray-700">
                {office.address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <span>{office.address}</span>
                  </div>
                )}
                {office.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 shrink-0 text-blue-600" />
                    <a href={`tel:${office.phone}`} className="text-blue-700 hover:underline">{office.phone}</a>
                  </div>
                )}
                {office.email && (
                  <div className="flex items-center gap-2.5">
                    <Mail className="size-4 shrink-0 text-blue-600" />
                    <a href={`mailto:${office.email}`} className="break-all text-blue-700 hover:underline">{office.email}</a>
                  </div>
                )}
                {(office.workingDays || office.workingHours) && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="mt-0.5 size-4 shrink-0 text-blue-600" />
                    <span>{[office.workingDays, office.workingHours].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {office.ctaPhone && (
                  <a
                    href={`tel:${office.ctaPhone}`}
                    className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-orange-700"
                  >
                    <Phone className="size-4" />
                    Call Now: {office.ctaPhone}
                  </a>
                )}
              </div>
            </SidebarCard>

            {/* Related offices */}
            {relatedOffices.length > 0 && (
              <SidebarCard icon={Building2} title={`${office.airlineName} Locations`} flush>
                <div className="divide-y divide-gray-100">
                  {relatedOffices.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/${related.airlineSlug}/${related.slug}/`}
                      className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50/50"
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
                      <span className="text-sm leading-tight text-gray-700 transition-colors group-hover:text-blue-800">
                        {related.fullTitle}
                      </span>
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/${office.airlineSlug}/`}
                  className="flex items-center gap-1 border-t border-gray-100 px-4 py-3 text-sm font-medium text-blue-700 transition-colors hover:text-blue-900"
                >
                  View all {office.airlineName} offices
                  <ChevronRight className="size-4" />
                </Link>
              </SidebarCard>
            )}

            {/* Airline / socials */}
            <SidebarCard icon={PlaneTakeoff} title={`About ${office.airlineName}`}>
              <div className="space-y-3 text-sm text-gray-700">
                <Link href={`/${office.airlineSlug}/`} className="flex items-center gap-2 text-blue-700 hover:underline">
                  <Ticket className="size-4 text-blue-600" />
                  Airline overview &amp; all offices
                </Link>
                {office.website && (
                  <a href={office.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-700 hover:underline">
                    <Globe2 className="size-4 text-blue-600" />
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
                        className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium capitalize text-blue-800 transition-colors hover:bg-blue-100"
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

      {/* ════════════════════ STICKY MOBILE CALL BAR ════════════════════ */}
      {office.ctaPhone && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50 bg-orange-600 pb-[env(safe-area-inset-bottom)] shadow-2xl lg:hidden">
            <a
              href={`tel:${office.ctaPhone}`}
              className="flex w-full items-center justify-center gap-3 py-3.5 text-base font-bold tracking-wide text-white transition-colors hover:bg-orange-700"
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
  return (
    <h2 className="mb-4 flex items-center gap-3 text-2xl font-bold text-gray-900">
      <span aria-hidden="true" className="h-6 w-1.5 rounded-full bg-blue-800" />
      {children}
    </h2>
  )
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
  const cls = 'flex items-center gap-3 bg-white px-3 py-5 transition-colors lg:px-5'
  const inner = (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="truncate text-sm font-medium text-gray-800">{value}</p>
      </div>
    </>
  )
  if (!href) return <div className={cls}>{inner}</div>
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`${cls} hover:bg-blue-50/50`}
    >
      {inner}
    </a>
  )
}
