import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
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

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airlineSlug, officeSlug } = await params
  const office = await getOffice(airlineSlug, officeSlug)
  if (!office) return { title: 'Not Found' }
  return {
    title: office.metaTitle,
    description: office.metaDescription,
    openGraph: {
      title: office.metaTitle,
      description: office.metaDescription,
      images: office.ogImage ? [office.ogImage] : [],
      type: 'article',
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${airlineSlug}/${officeSlug}/`,
    },
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function OfficePage({ params }: Props) {
  const { airlineSlug, officeSlug } = await params

  // Fetch current office + sibling offices for sidebar — parallel
  const [office, siblingOffices] = await Promise.all([
    getOffice(airlineSlug, officeSlug),
    getOfficesByAirline(airlineSlug),
  ])

  if (!office || !office.isPublished) notFound()

  // Sidebar: other offices of same airline (exclude current)
  const relatedOffices = siblingOffices
    .filter((o) => o.slug !== officeSlug)
    .slice(0, 5)

  // Hero image: prefer heroImage field, fallback to ogImage, fallback to default
  const heroBg = office.heroImage || office.ogImage || '/images/offices/default-hero.jpg'

  // Services chunked into rows of 3 for table layout
  const serviceRows: string[][] = []
  for (let i = 0; i < office.services.length; i += 3) {
    serviceRows.push(office.services.slice(i, i + 3))
  }

  // Build overview table rows from JSON fields — only show if value exists
  const overviewRows = [
    { label: `${office.airlineName} ${office.city} Office Address`, value: office.address, isLink: false },
    office.phone  && { label: `${office.airlineName} ${office.city} Contact Number`, value: office.phone,  isLink: false },
    { label: 'Working Hours / Days', value: `${office.workingDays}, ${office.workingHours}`, isLink: false },
    { label: 'Official Website',     value: office.website,       isLink: true },
    office.onlineCheckin && { label: 'Online Check-in', value: office.onlineCheckin, isLink: true },
    office.flightStatus  && { label: 'Flight Status',   value: office.flightStatus,  isLink: true },
    office.baggageInfo   && { label: 'Baggage',         value: office.baggageInfo,   isLink: true },
    office.email         && { label: 'Email',           value: office.email,         isLink: false },
  ].filter(Boolean) as { label: string; value: string; isLink: boolean }[]

  // Schema.org LocalBusiness
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: office.fullTitle,
    address: {
      '@type': 'PostalAddress',
      streetAddress: office.address,
      addressLocality: office.city,
      addressCountry: office.countryCode,
    },
    telephone: office.phone,
    email: office.email,
    openingHours: `${office.workingDays} ${office.workingHours}`,
    url: office.website,
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ════════════════════════════════════════
          HERO — dynamic bg from JSON heroImage/ogImage
          ════════════════════════════════════════ */}
      <section
        className="relative min-h-105 flex items-center"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-slate-900/72" />

        <div className="relative z-10 w-full max-w-7xl mx-auto p-4 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left: Title + quick info + CTA */}
            <div className="flex-1 text-white">

              {/* Breadcrumb */}
              <nav className="flex flex-wrap items-center gap-1 text-sm text-green-400 mb-4 font-medium">
                <a href="/" className="hover:text-white transition-colors">Home</a>
                <span className="text-slate-400">»</span>
                <a href={`/${office.airlineSlug}/`} className="hover:text-white transition-colors">
                  {office.airlineName}
                </a>
                <span className="text-slate-400">»</span>
                <span className="text-slate-200">{office.fullTitle}</span>
              </nav>

              {/* H1 — from JSON fullTitle */}
              <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-5">
                {office.fullTitle}
              </h1>

              {/* Quick info list — all from JSON */}
              <ul className="space-y-2 mb-6 text-slate-200 text-sm">
                <li className="flex items-start gap-2">
                  <LocationIcon />
                  {office.address}
                </li>
                {office.phone && (
                  <li className="flex items-center gap-2">
                    <PhoneIcon />
                    {office.phone}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <ClockIcon />
                  {office.workingDays}, {office.workingHours}
                </li>
                <li className="flex items-center gap-2">
                  <GlobeIcon />
                  {office.website}
                </li>
              </ul>

              {/* Green CTA button — phone from JSON */}
              {office.ctaPhone && (
                <a
                  href={`tel:${office.ctaPhone}`}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm uppercase tracking-wide px-6 py-3 rounded transition-colors shadow-lg"
                >
                  <PhoneIcon />
                  Call Now: {office.ctaPhone}
                </a>
              )}
            </div>

            {/* Right: Map card — from JSON mapEmbedUrl */}
            {office.mapEmbedUrl && (
              <div className="w-full lg:w-80 xl:w-96 shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                <iframe
                  src={office.mapEmbedUrl}
                  title={`Map for ${office.fullTitle}`}
                  width="100%"
                  height="280"
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

      {/* ════════════════════════════════════════
          BODY — 2-column: main content + sidebar
          ════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto p-4 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0 space-y-10">

            {/* Intro paragraphs — from JSON content.introP1 / introP2 */}
            <div className="text-slate-700 text-[15px] leading-relaxed space-y-3">
              {office.content?.introP1 && (
                <p>
                  <a href={`/${office.airlineSlug}/`} className="text-green-600 hover:underline font-medium">
                    {office.airlineName}
                  </a>{' '}
                  {office.content.introP1}
                </p>
              )}
              {office.content?.introP2 && (
                <p>{office.content.introP2}</p>
              )}
            </div>

            {/* ── KEY OVERVIEW TABLE — 100% from JSON ── */}
            <section>
              <SectionHeading>Key Overview: {office.fullTitle}</SectionHeading>
              {office.content?.overviewDesc && (
                <p className="text-slate-600 text-[15px] mb-5 leading-relaxed">
                  {office.content.overviewDesc}
                </p>
              )}
              <StripedTable>
                {overviewRows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="px-4 py-3 font-semibold text-slate-700 w-64 align-top text-sm">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-slate-600 align-top text-sm">
                      {row.isLink ? (
                        <a href={row.value} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline break-all transition-colors">
                          {row.value}
                        </a>
                      ) : row.value}
                    </td>
                  </tr>
                ))}
              </StripedTable>

              {/* Social Media — from JSON socialMedia field */}
              {office.socialMedia && Object.values(office.socialMedia).some(Boolean) && (
                <div className="mt-5">
                  <p className="font-semibold text-slate-700 text-sm mb-2">
                    Social Media Handles of {office.airlineName}
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {office.socialMedia.facebook && (
                      <li><span className="font-medium">Facebook: </span>
                        <a href={office.socialMedia.facebook} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:underline">{office.socialMedia.facebook}</a>
                      </li>
                    )}
                    {office.socialMedia.twitter && (
                      <li><span className="font-medium">Twitter: </span>
                        <a href={office.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:underline">{office.socialMedia.twitter}</a>
                      </li>
                    )}
                    {office.socialMedia.instagram && (
                      <li><span className="font-medium">Instagram: </span>
                        <a href={office.socialMedia.instagram} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:underline">{office.socialMedia.instagram}</a>
                      </li>
                    )}
                    {office.socialMedia.youtube && (
                      <li><span className="font-medium">YouTube: </span>
                        <a href={office.socialMedia.youtube} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:underline">{office.socialMedia.youtube}</a>
                      </li>
                    )}
                    {office.socialMedia.linkedin && (
                      <li><span className="font-medium">LinkedIn: </span>
                        <a href={office.socialMedia.linkedin} target="_blank" rel="noopener noreferrer"
                          className="text-green-600 hover:underline">{office.socialMedia.linkedin}</a>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </section>

            {/* ── SERVICES — from JSON services[] array ── */}
            {office.services?.length > 0 && (
              <section>
                <SectionHeading>Passenger Services at {office.fullTitle}</SectionHeading>
                {office.content?.servicesDesc && (
                  <p className="text-slate-600 text-[15px] mb-5 leading-relaxed">
                    {office.content.servicesDesc}
                  </p>
                )}
                <StripedTable>
                  {serviceRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      {row.map((service) => (
                        <td key={service} className="px-4 py-3 text-slate-700 w-1/3 text-sm">
                          <span className="flex items-center gap-2">
                            <CheckIcon />
                            {service}
                          </span>
                        </td>
                      ))}
                      {Array.from({ length: 3 - row.length }).map((_, i) => (
                        <td key={`pad-${i}`} className="px-4 py-3 w-1/3" />
                      ))}
                    </tr>
                  ))}
                </StripedTable>
              </section>
            )}

            {/* ── AIRPORT INFO — from JSON airport{} object ── */}
            {office.airport && (
              <section>
                <SectionHeading>
                  {office.airlineName} {office.city} Airport Office Details
                </SectionHeading>
                {office.content?.airportDesc && (
                  <p className="text-slate-600 text-[15px] mb-5 leading-relaxed">
                    {office.content.airportDesc}
                  </p>
                )}
                <StripedTable>
                  {[
                    { label: 'Airport Name',     value: office.airport.name },
                    { label: 'Airport Code',     value: office.airport.code },
                    { label: 'Terminal',         value: office.airport.terminal },
                    { label: 'Address',          value: office.airport.address },
                    ...(office.airport.phone ? [{ label: 'Contact Number', value: office.airport.phone }] : []),
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-3 font-semibold text-slate-700 w-64 text-sm">{row.label}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{row.value}</td>
                    </tr>
                  ))}
                </StripedTable>
              </section>
            )}

            {/* ── FLEET — from JSON fleet[] array ── */}
            {office.fleet?.length > 0 && (
              <section>
                <SectionHeading>Fleet Information of {office.airlineName}</SectionHeading>
                {office.content?.fleetDesc && (
                  <p className="text-slate-600 text-[15px] mb-5 leading-relaxed">
                    {office.content.fleetDesc}
                  </p>
                )}
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-bold text-slate-700">Aircraft</th>
                        <th className="text-left px-4 py-3 font-bold text-slate-700">In Fleet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {office.fleet.map((f, i) => (
                        <tr key={f.aircraft}
                          className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                          <td className="px-4 py-3 text-slate-700">{f.aircraft}</td>
                          <td className="px-4 py-3 text-slate-600 font-semibold">{f.inService}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── MAP SECTION — from JSON mapEmbedUrl ── */}
            {office.mapEmbedUrl && (
              <section>
                <SectionHeading>Map for {office.fullTitle}</SectionHeading>
                {office.content?.mapDesc && (
                  <p className="text-slate-600 text-[15px] mb-5 leading-relaxed">
                    {office.content.mapDesc}
                  </p>
                )}
                <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <iframe
                    src={office.mapEmbedUrl}
                    title={`Map for ${office.fullTitle}`}
                    width="100%"
                    height="420"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    className="block"
                  />
                </div>
              </section>
            )}

            {/* ── FAQS — from JSON faqs[] array ── */}
            {office.faqs?.length > 0 && (
              <section>
                <SectionHeading>Frequently Asked Questions</SectionHeading>
                <div className="space-y-2">
                  {office.faqs.map((faq, i) => (
                    <details key={i}
                      className="group border border-slate-200 rounded-lg overflow-hidden">
                      <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none bg-white hover:bg-slate-50 transition-colors select-none">
                        <span className="font-semibold text-slate-800 text-sm">{faq.question}</span>
                        <svg className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 group-open:rotate-180"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-5 py-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* ── CONCLUSION — from JSON content.conclusionDesc ── */}
            {office.content?.conclusionDesc && (
              <section>
                <SectionHeading>Conclusion</SectionHeading>
                <p className="text-slate-600 text-[15px] leading-relaxed">
                  {office.content.conclusionDesc}
                </p>
              </section>
            )}

          </main>

          {/* ── SIDEBAR ── */}
          <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-6 lg:sticky lg:top-28">

            {/* Related offices — from getOfficesByAirline() */}
            {relatedOffices.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-800 text-white px-4 py-3">
                  <h3 className="font-bold text-sm">{office.airlineName} Locations</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {relatedOffices.map((related) => (
                    <a
                      key={related.slug}
                      href={`/${related.airlineSlug}/${related.slug}/`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      {/* Thumbnail from related office ogImage */}
                      <div className="w-14 h-10 rounded bg-slate-200 shrink-0 overflow-hidden">
                        {related.ogImage ? (
                          <img
                            src={related.ogImage}
                            alt={related.fullTitle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
                        )}
                      </div>
                      <span className="text-sm text-slate-700 group-hover:text-green-600 transition-colors leading-tight">
                        {related.fullTitle}
                      </span>
                    </a>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-slate-100">
                  <a href={`/${office.airlineSlug}/`}
                    className="text-sm text-green-600 hover:text-green-800 font-medium hover:underline transition-colors">
                    View all {office.airlineName} offices →
                  </a>
                </div>
              </div>
            )}

            {/* Quick contact card — all from JSON */}
            <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-green-600 text-white px-4 py-3">
                <h3 className="font-bold text-sm">Quick Contact</h3>
              </div>
              <div className="p-4 space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <LocationIcon className="text-green-500 mt-0.5" />
                  <span>{office.address}</span>
                </div>
                {office.phone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="text-green-500" />
                    <a href={`tel:${office.phone}`} className="text-green-600 hover:underline">
                      {office.phone}
                    </a>
                  </div>
                )}
                {office.email && (
                  <div className="flex items-center gap-2">
                    <EmailIcon className="text-green-500" />
                    <span className="break-all">{office.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <ClockIcon className="text-green-500" />
                  <span>{office.workingDays}, {office.workingHours}</span>
                </div>
                {office.ctaPhone && (
                  <a
                    href={`tel:${office.ctaPhone}`}
                    className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wide py-3 rounded transition-colors mt-2"
                  >
                    <PhoneIcon />
                    Call Now: {office.ctaPhone}
                  </a>
                )}
              </div>
            </div>

          </aside>
        </div>
      </div>

      {/* ════════════════════════════════════════
          STICKY BOTTOM BAR — phone from JSON
          ════════════════════════════════════════ */}
      {office.ctaPhone && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-green-500 shadow-2xl">
          <a
            href={`tel:${office.ctaPhone}`}
            className="flex items-center justify-center gap-3 text-white font-bold text-base tracking-wide py-3 hover:bg-green-600 transition-colors w-full"
          >
            <PhoneIcon />
            CALL NOW: {office.ctaPhone}
          </a>
        </div>
      )}

      {/* Spacer so sticky bar doesn't hide last content */}
      <div className="h-16" />
    </>
  )
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-slate-800 mb-4">{children}</h2>
  )
}

function StripedTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full">
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

// ─── SVG Icon helpers (keeps JSX clean) ──────────────────────────────────────

function LocationIcon({ className = 'text-white' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PhoneIcon({ className = 'text-white' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  )
}

function ClockIcon({ className = 'text-white' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function GlobeIcon({ className = 'text-white' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
    </svg>
  )
}

function EmailIcon({ className = 'text-white' }: { className?: string }) {
  return (
    <svg className={`w-4 h-4 ${className} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd" />
    </svg>
  )
}