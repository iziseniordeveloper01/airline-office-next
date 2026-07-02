import { and, inArray, asc, eq, gt, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { blogPosts, blogFaqs } from '@/lib/schema'
import { imageUrl } from '@/lib/images'
import { isPubliclyVisible, notTrashed } from '@/lib/visibility'
import type { BlogPost, BlogPostIndex } from '@/types'

export interface StatusCounts {
  draft: number
  scheduled: number
  published: number
  trashed: number
}

function mapIndex(p: typeof blogPosts.$inferSelect): BlogPostIndex {
  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? '',
    featuredImage: imageUrl(p.heroImageId) ?? '',
    category: p.category ?? '',
    author: p.author ?? '',
    // A post that's live via on-read (scheduled + due) but not yet flipped by the
    // cron route has publishedAt === null — fall back to scheduledAt so listings/
    // JSON-LD never render a blank date.
    publishedAt: (p.publishedAt ?? p.scheduledAt)?.toISOString() ?? '',
    updatedAt: p.updatedAt?.toISOString() ?? '',
    readingTime: p.readingTime ?? '',
  }
}

// Blog listing page ke liye — sirf published posts, newest first
export async function getAllBlogPosts(): Promise<BlogPostIndex[]> {
  const rows = await db.query.blogPosts.findMany({
    where: isPubliclyVisible(blogPosts),
    orderBy: (b, { desc }) => [desc(sql`COALESCE(${b.publishedAt}, ${b.scheduledAt})`)],
  })
  return rows.map(mapIndex)
}

// Single post detail
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), isPubliclyVisible(blogPosts)),
  })
  if (!post) return null

  const faqs = await db.select().from(blogFaqs)
    .where(eq(blogFaqs.postId, post.id))
    .orderBy(asc(blogFaqs.sortOrder))

  return {
    ...mapIndex(post),
    content: post.content ?? '',
    metaTitle: post.metaTitle ?? '',
    metaDescription: post.metaDescription ?? '',
    ogImage: imageUrl(post.ogImageId) ?? '',
    canonicalUrl: post.canonicalUrl ?? undefined,
    noindex: !!post.noindex,
    faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
    relatedPosts: post.relatedPosts ? JSON.parse(post.relatedPosts) : [],
  }
}

// Sitemap + generateStaticParams ke liye
export async function getAllBlogSlugs(): Promise<
  { slug: string; updatedAt: string }[]
> {
  const posts = await getAllBlogPosts()
  return posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }))
}

// Related posts fetch karo (slugs array se)
export async function getRelatedPosts(
  slugs: string[]
): Promise<BlogPostIndex[]> {
  if (!slugs.length) return []
  const rows = await db.query.blogPosts.findMany({
    where: and(inArray(blogPosts.slug, slugs), isPubliclyVisible(blogPosts)),
  })
  return rows.map(mapIndex).slice(0, 3)
}

// Latest N posts — sidebar widget ke liye
export async function getLatestPosts(limit = 6): Promise<BlogPostIndex[]> {
  const posts = await getAllBlogPosts()
  return posts.slice(0, limit)
}

// Admin dashboard widget — same 4-bucket shape as getOfficeStatusCounts/getAirlineStatusCounts.
export async function getBlogStatusCounts(): Promise<StatusCounts> {
  const now = new Date()
  const [[draft], [scheduled], [published], [trashed]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(blogPosts)
      .where(and(eq(blogPosts.status, 'draft'), notTrashed(blogPosts))),
    db.select({ count: sql<number>`count(*)` }).from(blogPosts)
      .where(and(eq(blogPosts.status, 'scheduled'), gt(blogPosts.scheduledAt, now), notTrashed(blogPosts))),
    db.select({ count: sql<number>`count(*)` }).from(blogPosts)
      .where(isPubliclyVisible(blogPosts, now)),
    db.select({ count: sql<number>`count(*)` }).from(blogPosts)
      .where(isNotNull(blogPosts.deletedAt)),
  ])
  return {
    draft: Number(draft.count),
    scheduled: Number(scheduled.count),
    published: Number(published.count),
    trashed: Number(trashed.count),
  }
}
