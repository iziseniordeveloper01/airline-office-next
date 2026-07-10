import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/layout/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service | Airline Office Directory',
  description:
    'The terms and conditions that govern your use of the Airline Office Directory website.',
  alternates: { canonical: '/terms/' },
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 7, 2026">
      <div className="prose-content">
        <p>
          These Terms of Service govern your use of Airline Office Directory. By accessing or using
          the site, you agree to these terms. If you do not agree, please do not use the site.
        </p>

        <h2>Use of the site</h2>
        <p>
          You may use this directory for personal, non-commercial purposes to find airline office
          information. You agree not to misuse the site, including by scraping at scale, attempting
          to disrupt it, or using it for any unlawful purpose.
        </p>

        <h2>Accuracy of information</h2>
        <p>
          We work to keep airline office addresses, phone numbers and hours accurate and up to
          date, but we cannot guarantee that every detail is current or error-free. Always confirm
          critical details directly with the airline before travelling or making decisions.
        </p>

        <h2>No affiliation</h2>
        <p>
          Airline Office Directory is an independent service and is not affiliated with, authorised
          by, or endorsed by any airline. Airline names, logos and trademarks are the property of
          their respective owners and are used for identification only.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          The site is provided &ldquo;as is&rdquo; without warranties of any kind. To the fullest
          extent permitted by law, we are not liable for any loss or damage arising from your use
          of the site or reliance on its information, including missed flights, incorrect contact
          details, or third-party actions.
        </p>

        <h2>Third-party links</h2>
        <p>
          The site links to external websites we do not control. We are not responsible for their
          content, availability, or practices.
        </p>

        <h2>Changes to these terms</h2>
        <p>
          We may revise these terms at any time. The &ldquo;last updated&rdquo; date below reflects
          the current version. Continued use of the site constitutes acceptance of the updated
          terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms? Reach us through our <Link href="/contact/">contact page</Link>.
        </p>
      </div>
    </LegalPage>
  )
}
