import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage from '@/components/layout/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy | Airline Office Directory',
  description:
    'How Airline Office Directory collects, uses and protects information when you use our website.',
  alternates: { canonical: '/privacy/' },
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 7, 2026">
      <div className="prose-content">
        <p>
          This Privacy Policy explains how Airline Office Directory (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;) handles information when you visit our website. By using the site, you
          agree to the practices described here.
        </p>

        <h2>Information we collect</h2>
        <p>
          We do not require you to create an account or submit personal information to browse the
          directory. We may collect limited, non-identifying information automatically, such as
          your browser type, device, referring page and general usage patterns, to understand how
          the site is used and to improve it.
        </p>

        <h2>Cookies and analytics</h2>
        <p>
          We may use cookies and third-party analytics tools to measure traffic and performance.
          These tools may set their own cookies. You can control or disable cookies through your
          browser settings; some site features may not work as intended if you do.
        </p>

        <h2>Third-party links</h2>
        <p>
          Listings may link to airline websites and other third-party services. We are not
          responsible for the content or privacy practices of those sites; please review their
          policies separately.
        </p>

        <h2>Data sharing</h2>
        <p>
          We do not sell your personal information. Aggregated, non-identifying analytics may be
          processed by our service providers solely to operate and improve the site.
        </p>

        <h2>Your choices</h2>
        <p>
          Because we don&apos;t collect identifying personal data through normal browsing, there is
          typically nothing to access or delete. If you contact us by email, we retain that
          correspondence only as long as needed to respond.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy from time to time. Material changes will be reflected by the
          &ldquo;last updated&rdquo; date below. Continued use of the site after changes means you
          accept the revised policy.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Reach us through our <Link href="/contact/">contact page</Link>.
        </p>
      </div>
    </LegalPage>
  )
}
