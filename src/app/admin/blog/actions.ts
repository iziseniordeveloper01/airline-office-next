'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, ne, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { blogPosts, blogFaqs, blogCategories, blogTags, blogPostTags } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { cleanHtml } from '@/lib/sanitize'
import { ensureUniqueSlug, readingTime, sanitizeSlug } from '@/lib/slug'
import { deleteReplacedImage } from '@/lib/images'
import { isCurrentlyLive } from '@/lib/visibility'
import { resolveStatusFields } from '@/lib/validation/content'
import { logActivity } from '@/lib/activity'

function revalidateBlogPaths(slug: string) {
  revalidatePath('/blog')
  revalidatePath(`/blog/${slug}`)
  revalidatePath('/admin/blog')
}

export async function saveBlogPost(formData: FormData) {
  const session = await requireRole('editor')
  const raw = Object.fromEntries(formData)
  const postId = raw.id ? parseInt(raw.id as string) : null
  const content = cleanHtml(raw.content as string)

  const existing = postId
    ? (await db.select({
        slug: blogPosts.slug,
        status: blogPosts.status,
        scheduledAt: blogPosts.scheduledAt,
        publishedAt: blogPosts.publishedAt,
        heroImageId: blogPosts.heroImageId,
        ogImageId: blogPosts.ogImageId,
      }).from(blogPosts).where(eq(blogPosts.id, postId)))[0] ?? null
    : null

  const locked = existing ? isCurrentlyLive(existing) : false
  const slug = locked
    ? existing!.slug
    : await ensureUniqueSlug(raw.slug as string, async (candidate) => {
        const rows = await db.select({ id: blogPosts.id }).from(blogPosts).where(
          and(eq(blogPosts.slug, candidate), postId ? ne(blogPosts.id, postId) : undefined)
        )
        return rows.length > 0
      })

  const { status, scheduledAt, publishedAt } = resolveStatusFields(
    { status: raw.status as string, scheduledAt: (raw.scheduledAt as string) || null },
    existing?.publishedAt ?? null
  )

  // Category comes as an id; the denormalized name is looked up server-side so
  // a tampered form can't desync name from id.
  const categoryId = raw.categoryId ? parseInt(raw.categoryId as string) : null
  const [category] = categoryId
    ? await db.select({ name: blogCategories.name }).from(blogCategories).where(eq(blogCategories.id, categoryId))
    : []

  const data = {
    slug,
    title:           raw.title as string,
    excerpt:         (raw.excerpt as string) || null,
    category:        category?.name ?? null,
    categoryId:      category ? categoryId : null,
    content,
    heroImageId:     (raw.heroImageId as string) || null,
    ogImageId:       (raw.ogImageId as string) || null,
    author:          (raw.author as string) || null,
    relatedPosts:    (raw.relatedPosts as string) || '[]',
    metaTitle:       (raw.metaTitle as string) || null,
    metaDescription: (raw.metaDescription as string) || null,
    canonicalUrl:    (raw.canonicalUrl as string) || null,
    noindex:         raw.noindex === 'true',
    readingTime:     readingTime(content),
    status,
    scheduledAt,
    publishedAt,
    draftData:       null,
    draftSavedAt:    null,
  }

  let resolvedPostId: number

  if (postId) {
    resolvedPostId = postId

    await db.update(blogPosts).set(data).where(eq(blogPosts.id, postId))
    await db.delete(blogFaqs).where(eq(blogFaqs.postId, postId))

    await Promise.all([
      deleteReplacedImage(existing?.heroImageId, data.heroImageId),
      deleteReplacedImage(existing?.ogImageId, data.ogImageId),
    ])
  } else {
    const [result] = await db.insert(blogPosts).values(data)
    resolvedPostId = result.insertId
  }

  const faqsRaw = raw.faqs as string
  if (faqsRaw) {
    const faqs: Array<{ question: string; answer: string }> = JSON.parse(faqsRaw)
    if (faqs.length > 0) {
      await db.insert(blogFaqs).values(
        faqs.map((faq, i) => ({ postId: resolvedPostId, question: faq.question, answer: faq.answer, sortOrder: i }))
      )
    }
  }

  // Tags — sent as a JSON array of names; unknown tags are auto-created
  // (WP behaviour), then the junction rows are replaced wholesale.
  const tagsRaw = raw.tags as string | undefined
  if (tagsRaw !== undefined) {
    const names = Array.from(new Set(
      (JSON.parse(tagsRaw) as string[]).map((t) => t.trim()).filter(Boolean)
    )).slice(0, 20)

    await db.delete(blogPostTags).where(eq(blogPostTags.postId, resolvedPostId))
    if (names.length > 0) {
      for (const name of names) {
        const tagSlug = sanitizeSlug(name) || 'untitled'
        await db.insert(blogTags).values({ name, slug: tagSlug }).onDuplicateKeyUpdate({ set: { name } })
      }
      const slugs = names.map((n) => sanitizeSlug(n) || 'untitled')
      const tagRows = await db.select({ id: blogTags.id }).from(blogTags).where(inArray(blogTags.slug, slugs))
      if (tagRows.length > 0) {
        await db.insert(blogPostTags).values(tagRows.map((t) => ({ postId: resolvedPostId, tagId: t.id })))
      }
    }
  }

  revalidateBlogPaths(slug)
  await logActivity(session.user, {
    action: postId ? 'updated' : 'created',
    entityType: 'blog',
    entityId: resolvedPostId,
    entityTitle: data.title,
    href: `/admin/blog/${slug}`,
  })
  redirect('/admin/blog')
}

// Debounced autosave while editing — see src/app/admin/offices/actions.ts:autosaveOffice
// for the draft-vs-live buffering rationale (identical pattern, applied here).
export async function autosaveBlogPost(
  id: number,
  data: { content?: string; metaTitle?: string; metaDescription?: string }
) {
  await requireRole('editor')
  const [existing] = await db.select({ status: blogPosts.status, scheduledAt: blogPosts.scheduledAt })
    .from(blogPosts).where(eq(blogPosts.id, id))
  if (!existing) return { ok: false as const }

  if (isCurrentlyLive(existing)) {
    await db.update(blogPosts).set({ draftData: JSON.stringify(data), draftSavedAt: new Date() }).where(eq(blogPosts.id, id))
  } else {
    await db.update(blogPosts).set({
      content: data.content !== undefined ? cleanHtml(data.content) : undefined,
      readingTime: data.content !== undefined ? readingTime(data.content) : undefined,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      draftData: null,
      draftSavedAt: new Date(),
    }).where(eq(blogPosts.id, id))
  }
  return { ok: true as const, savedAt: new Date().toISOString() }
}

export async function trashBlogPost(id: number) {
  const session = await requireRole('editor')
  const [post] = await db.select({ slug: blogPosts.slug, title: blogPosts.title }).from(blogPosts).where(eq(blogPosts.id, id))
  if (!post) return
  await db.update(blogPosts).set({ deletedAt: new Date() }).where(eq(blogPosts.id, id))
  revalidateBlogPaths(post.slug)
  revalidatePath('/admin/blog/trash')
  await logActivity(session.user, { action: 'trashed', entityType: 'blog', entityId: id, entityTitle: post.title })
}

export async function restoreBlogPost(id: number) {
  const session = await requireRole('admin')
  const [post] = await db.select({ slug: blogPosts.slug, title: blogPosts.title }).from(blogPosts).where(eq(blogPosts.id, id))
  if (!post) return
  await db.update(blogPosts).set({ deletedAt: null }).where(eq(blogPosts.id, id))
  revalidateBlogPaths(post.slug)
  revalidatePath('/admin/blog/trash')
  await logActivity(session.user, { action: 'restored', entityType: 'blog', entityId: id, entityTitle: post.title, href: `/admin/blog/${post.slug}` })
}

export async function deleteBlogPostPermanently(id: number) {
  const session = await requireRole('admin')
  const [post] = await db.select({ slug: blogPosts.slug, title: blogPosts.title }).from(blogPosts).where(eq(blogPosts.id, id))
  await db.delete(blogPosts).where(eq(blogPosts.id, id))
  revalidatePath('/admin/blog')
  revalidatePath('/admin/blog/trash')
  revalidatePath(`/blog/${post?.slug ?? ''}`)
  await logActivity(session.user, { action: 'deleted', entityType: 'blog', entityId: id, entityTitle: post?.title ?? null })
}
