import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { offices, airlines, blogPosts, officeFaqs, blogFaqs } from '@/lib/schema'
import { isPubliclyVisible } from '@/lib/visibility'

export interface HealthIssueItem {
  type: 'Office' | 'Airline' | 'Blog'
  title: string
  href: string
  issues: string[]
}

export interface ContentHealth {
  totalChecked: number
  healthyCount: number
  /** 0–100 — % of live items with zero issues */
  score: number
  /** issue label → how many live items have it */
  issueCounts: { label: string; count: number }[]
  /** worst offenders, most issues first */
  needsAttention: HealthIssueItem[]
}

const THIN_CONTENT_WORDS = 300

function wordCount(html: string | null): number {
  if (!html) return 0
  return html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
}

// SEO/completeness audit over everything currently LIVE on the public site.
// Drafts are skipped on purpose — unfinished content isn't a health problem,
// incomplete *published* content is. All checks run off columns we already
// have; content length is counted in JS (fleet is small; revisit if the
// directory grows past a few thousand rows).
export async function getContentHealth(): Promise<ContentHealth> {
  const [officeRows, airlineRows, blogRows, officeFaqRows, blogFaqRows] = await Promise.all([
    db.select({
      id: offices.id,
      slug: offices.slug,
      fullTitle: offices.fullTitle,
      metaTitle: offices.metaTitle,
      metaDescription: offices.metaDescription,
      ogImageId: offices.ogImageId,
      heroImageId: offices.heroImageId,
      content: offices.content,
      noindex: offices.noindex,
      address: offices.address,
      phone: offices.phone,
      airlineSlug: airlines.slug,
    })
      .from(offices)
      .innerJoin(airlines, eq(offices.airlineId, airlines.id))
      .where(isPubliclyVisible(offices)),
    db.select({
      id: airlines.id,
      slug: airlines.slug,
      name: airlines.name,
      metaTitle: airlines.metaTitle,
      metaDescription: airlines.metaDescription,
      logoImageId: airlines.logoImageId,
      description: airlines.description,
      noindex: airlines.noindex,
    })
      .from(airlines)
      .where(isPubliclyVisible(airlines)),
    db.select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      metaTitle: blogPosts.metaTitle,
      metaDescription: blogPosts.metaDescription,
      ogImageId: blogPosts.ogImageId,
      heroImageId: blogPosts.heroImageId,
      excerpt: blogPosts.excerpt,
      content: blogPosts.content,
      noindex: blogPosts.noindex,
      categoryId: blogPosts.categoryId,
    })
      .from(blogPosts)
      .where(isPubliclyVisible(blogPosts)),
    db.select({ officeId: officeFaqs.officeId }).from(officeFaqs),
    db.select({ postId: blogFaqs.postId }).from(blogFaqs),
  ])

  const officesWithFaqs = new Set(officeFaqRows.map((r) => r.officeId))
  const postsWithFaqs = new Set(blogFaqRows.map((r) => r.postId))

  const items: HealthIssueItem[] = []
  const counts = new Map<string, number>()
  const bump = (label: string) => counts.set(label, (counts.get(label) ?? 0) + 1)

  const audit = (item: HealthIssueItem, checks: [ok: boolean, label: string][]) => {
    for (const [ok, label] of checks) {
      if (!ok) {
        item.issues.push(label)
        bump(label)
      }
    }
    if (item.issues.length > 0) items.push(item)
  }

  for (const o of officeRows) {
    audit(
      { type: 'Office', title: o.fullTitle, href: `/admin/offices/${o.airlineSlug}/${o.slug}`, issues: [] },
      [
        [!!o.metaTitle, 'Missing meta title'],
        [!!o.metaDescription, 'Missing meta description'],
        [!!(o.ogImageId || o.heroImageId), 'No image'],
        [wordCount(o.content) >= THIN_CONTENT_WORDS, 'Thin content'],
        [officesWithFaqs.has(o.id), 'No FAQs'],
        [!o.noindex, 'Live but noindexed'],
        [!!o.address, 'Missing address'],
        [!!o.phone, 'Missing phone'],
      ]
    )
  }

  for (const a of airlineRows) {
    audit(
      { type: 'Airline', title: a.name, href: `/admin/airlines/${a.slug}`, issues: [] },
      [
        [!!a.metaTitle, 'Missing meta title'],
        [!!a.metaDescription, 'Missing meta description'],
        [!!a.logoImageId, 'No image'],
        [wordCount(a.description) >= 100, 'Thin content'],
        [!a.noindex, 'Live but noindexed'],
      ]
    )
  }

  for (const p of blogRows) {
    audit(
      { type: 'Blog', title: p.title, href: `/admin/blog/${p.slug}`, issues: [] },
      [
        [!!p.metaTitle, 'Missing meta title'],
        [!!p.metaDescription, 'Missing meta description'],
        [!!(p.ogImageId || p.heroImageId), 'No image'],
        [!!p.excerpt, 'Missing excerpt'],
        [wordCount(p.content) >= THIN_CONTENT_WORDS, 'Thin content'],
        [postsWithFaqs.has(p.id), 'No FAQs'],
        [!p.noindex, 'Live but noindexed'],
        [p.categoryId != null, 'Uncategorized'],
      ]
    )
  }

  const totalChecked = officeRows.length + airlineRows.length + blogRows.length
  const healthyCount = totalChecked - items.length

  return {
    totalChecked,
    healthyCount,
    score: totalChecked === 0 ? 100 : Math.round((healthyCount / totalChecked) * 100),
    issueCounts: Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    needsAttention: items.sort((a, b) => b.issues.length - a.issues.length).slice(0, 8),
  }
}
