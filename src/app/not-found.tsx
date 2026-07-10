import type { Metadata } from 'next'
import NotFoundView from '@/components/layout/NotFoundView'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

// Root fallback for truly unmatched URLs — renders with only the root layout
// (no Navbar/Footer), so it shows its own brand mark.
export default function RootNotFound() {
  return <NotFoundView withBrand />
}
