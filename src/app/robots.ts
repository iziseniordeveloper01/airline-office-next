import type { MetadataRoute } from 'next'
import { getSettings } from '@/lib/data/getSettings'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'

// robots.js is cached by default; settings are admin-editable and must reflect
// immediately, so this opts into request-time rendering same as sitemap.ts.
export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSettings()

  // Site-wide kill switch (WP's "Discourage search engines" equivalent) —
  // overrides every other rule when on, e.g. for a staging deploy.
  if (settings.robotsDisallowAll === 'true') {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  // /admin/ is always blocked regardless of settings — this is crawler
  // etiquette, not the actual admin security boundary (that's requireRole),
  // but it must never be admin-toggleable off.
  const disallow = ['/admin/']

  if (settings.robotsBlockQueryStrings === 'true') disallow.push('/*?*')

  const extra = settings.robotsExtraDisallow
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('/'))
  disallow.push(...extra)

  return {
    rules: { userAgent: '*', allow: '/', disallow },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
