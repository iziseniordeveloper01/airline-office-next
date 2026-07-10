import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/layout/LegalPage'

export const metadata: Metadata = {
  title: 'Disclaimer | Airline Office Directory',
  description:
    'Important disclaimer about the independent nature and accuracy of information on Airline Office Directory.',
  alternates: { canonical: '/disclaimer/' },
}

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="July 7, 2026">
      <div className="prose-content">
        <p>
          Airline Office Directory is an <strong>independent</strong> information directory. We are
          not an airline, a travel agency, or a booking service, and we are not affiliated with,
          authorised by, or endorsed by any airline or their representatives.
        </p>

        <h2>Trademarks</h2>
        <p>
          All airline names, logos, brand marks and trademarks displayed on this site are the
          property of their respective owners. They are used solely for identification and
          reference purposes and do not imply any endorsement or partnership.
        </p>

        <h2>Accuracy</h2>
        <p>
          While we make reasonable efforts to verify and update airline office addresses, phone
          numbers, working hours and other details, information can change without notice and may
          become outdated. We make no warranty as to the completeness or accuracy of any listing.
          Always verify details directly with the airline before relying on them.
        </p>

        <h2>No bookings or transactions</h2>
        <p>
          We do not sell tickets, process bookings, handle payments, or make changes to
          reservations. Any phone numbers or links provided connect you to the airline or its
          published contact points, not to us acting on the airline&apos;s behalf.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          We accept no responsibility for any loss, inconvenience or damage resulting from the use
          of, or reliance on, information found on this site. Your use of the directory is entirely
          at your own discretion and risk.
        </p>

        <h2>Report an issue</h2>
        <p>
          Found an inaccurate listing? Please tell us via our <Link href="/contact/">contact page</Link>{' '}
          so we can review and correct it.
        </p>
      </div>
    </LegalPage>
  )
}
