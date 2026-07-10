import type { Metadata } from 'next'
import { Mail, Phone } from 'lucide-react'
import LegalPage from '@/components/layout/LegalPage'
import { getSettings } from '@/lib/data/getSettings'
import { telHref } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Contact Us | Airline Office Directory',
  description:
    'Get in touch with Airline Office Directory to report an outdated listing, suggest an airline office, or ask a question.',
  alternates: { canonical: '/contact/' },
}

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const settings = await getSettings()
  const tel = telHref(settings.contactPhone)

  return (
    <LegalPage
      title="Contact Us"
      intro="Questions, corrections, or a missing office? We'd love to hear from you."
    >
      <div className="prose-content">
        <p>
          The fastest way to reach us is by phone or email. If you&apos;re reporting an incorrect
          listing, please include the airline name and city so we can verify and fix it quickly.
        </p>
      </div>

      {(settings.contactPhone || settings.contactEmail) && (
        <div className="not-prose mt-6 grid gap-4 sm:grid-cols-2">
          {settings.contactPhone && (
            <a
              href={tel}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 no-underline transition-colors hover:border-blue-300"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Phone className="size-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Phone</span>
                <span className="text-sm font-medium text-gray-900">{settings.contactPhone}</span>
              </span>
            </a>
          )}
          {settings.contactEmail && (
            <a
              href={`mailto:${settings.contactEmail}`}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 no-underline transition-colors hover:border-blue-300"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <Mail className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">Email</span>
                <span className="block truncate text-sm font-medium text-gray-900">{settings.contactEmail}</span>
              </span>
            </a>
          )}
        </div>
      )}

      <div className="prose-content mt-8">
        <h2>Reporting an incorrect listing</h2>
        <p>
          Airline office details change over time. If you find an address, phone number or working
          hours that no longer match, let us know and we&apos;ll review it. Please note we are an
          independent directory and cannot make bookings or changes on behalf of any airline.
        </p>
      </div>
    </LegalPage>
  )
}
