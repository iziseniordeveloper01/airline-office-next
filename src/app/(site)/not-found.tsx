import type { Metadata } from 'next'
import NotFoundView from '@/components/layout/NotFoundView'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

// Handles notFound() thrown by the dynamic public routes (airline/office/blog
// slugs that don't exist) — the common 404 case — and renders inside the (site)
// layout, so it keeps the Navbar and Footer.
export default function SiteNotFound() {
  return <NotFoundView />
}
