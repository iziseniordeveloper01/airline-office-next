import type { MetadataRoute } from 'next'
import { getAllOfficePaths } from '@/lib/data/getOffice'
import { getAllAirlines } from '@/lib/data/getAirline'
import { getAllBlogSlugs } from '@/lib/data/getBlog' 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

// Generated at runtime, not at build: it reads airlines/offices/blogs from
// MySQL, and Railway's build phase can't reach the private
// mysql.railway.internal host, so a build-time generation fails.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [airlines, officePaths, blogSlugs] = await Promise.all([
    getAllAirlines(),
    getAllOfficePaths(),
    getAllBlogSlugs(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/airlines/`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/headquarters/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/blog/`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/about/`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/contact/`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy/`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms/`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/disclaimer/`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  // noindex pages are intentionally excluded from public listings' index
  // signal but still browsable on-site — listing them here would contradict
  // the page's own noindex meta tag, so filter them out of the sitemap only.
  const airlinePages: MetadataRoute.Sitemap = airlines
    .filter((a) => !a.noindex)
    .map((a) => ({
      url: `${SITE_URL}/${a.slug}/`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

  const officePages: MetadataRoute.Sitemap = officePaths
    .filter((o) => !o.noindex)
    .map((o) => ({
      url: `${SITE_URL}/${o.airlineSlug}/${o.slug}/`,
      lastModified: new Date(o.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  // ── Blog pages ──
  const blogPages: MetadataRoute.Sitemap = blogSlugs
    .filter((b) => !b.noindex)
    .map((b) => ({
      url: `${SITE_URL}/blog/${b.slug}/`,
      lastModified: new Date(b.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  return [...staticPages, ...airlinePages, ...officePages, ...blogPages]
}