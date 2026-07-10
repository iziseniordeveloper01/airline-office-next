import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/layout/LegalPage'
import { getSettings } from '@/lib/data/getSettings'

export const metadata: Metadata = {
  title: 'About Us | Airline Office Directory',
  description:
    'Learn about Airline Office Directory — an independent, regularly verified directory of airline office addresses, contact numbers and headquarters worldwide.',
  alternates: { canonical: '/about/' },
}

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const settings = await getSettings()

  return (
    <LegalPage
      title="About Us"
      intro="An independent directory built to make airline office information easy to find and trust."
    >
      <div className="prose-content">
      <p>
        {settings.siteTitle} is an independent directory that helps travellers find verified
        airline office addresses, contact numbers, working hours and headquarters information
        from around the world — all in one place, without the clutter and ads of typical search
        results.
      </p>

      <h2>What we do</h2>
      <p>
        We collect, organise and manually review airline office details so that when you need to
        reach an airline — to change a booking, ask about baggage, or visit a local office — you
        have accurate, up-to-date information at hand.
      </p>

      <h2>Why trust our data</h2>
      <ul>
        <li>Office addresses, phone numbers and working hours are reviewed regularly.</li>
        <li>Headquarters and corporate contact details are kept alongside local offices.</li>
        <li>We cover major international carriers as well as regional airlines.</li>
      </ul>

      <h2>Independence</h2>
      <p>
        We are not affiliated with, endorsed by, or acting on behalf of any airline. All airline
        names, logos and trademarks belong to their respective owners and are used here for
        identification purposes only.
      </p>

      <h2>Get in touch</h2>
      <p>
        Spotted an outdated detail or want to suggest an office? Visit our{' '}
        <Link href="/contact/">contact page</Link> — we welcome corrections and feedback.
      </p>
      </div>
    </LegalPage>
  )
}
