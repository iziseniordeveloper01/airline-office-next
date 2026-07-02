import type { MetadataRoute } from 'next'
import { getAllOfficePaths } from '@/lib/data/getOffice'
import { getAllAirlines } from '@/lib/data/getAirline'
import { getAllBlogSlugs } from '@/lib/data/getBlog' 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

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
  ]

  const airlinePages: MetadataRoute.Sitemap = airlines.map((a) => ({
    url: `${SITE_URL}/${a.slug}/`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const officePages: MetadataRoute.Sitemap = officePaths.map((o) => ({
    url: `${SITE_URL}/${o.airlineSlug}/${o.slug}/`,
    lastModified: new Date(o.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // ── Blog pages ──
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((b) => ({
    url: `${SITE_URL}/blog/${b.slug}/`,
    lastModified: new Date(b.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...airlinePages, ...officePages, ...blogPages]
}