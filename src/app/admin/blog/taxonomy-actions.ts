'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { blogCategories, blogTags, blogPosts } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { sanitizeSlug } from '@/lib/slug'
import { bustTags, CACHE_TAGS } from '@/lib/cache'
import { logActivity } from '@/lib/activity'

const nameSchema = z.string().trim().min(1).max(100)

function revalidateTaxonomyPaths() {
  // Renaming/deleting a term changes the denormalized post category too, so bust
  // both the taxonomy and blog caches.
  bustTags(CACHE_TAGS.taxonomy, CACHE_TAGS.blog)
  revalidatePath('/admin/blog/categories')
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
}

export async function createBlogCategory(name: string, description?: string) {
  const session = await requireRole('editor')
  const parsed = nameSchema.parse(name)
  const slug = sanitizeSlug(parsed) || 'untitled'

  const existing = await db.select({ id: blogCategories.id }).from(blogCategories)
    .where(eq(blogCategories.slug, slug))
  if (existing.length > 0) throw new Error('A category with this name already exists.')

  await db.insert(blogCategories).values({
    name: parsed,
    slug,
    description: description?.trim() || null,
  })
  revalidateTaxonomyPaths()
  await logActivity(session.user, { action: 'created', entityType: 'blog', entityTitle: `Category: ${parsed}`, href: '/admin/blog/categories' })
}

export async function renameBlogCategory(id: number, name: string, description?: string) {
  const session = await requireRole('editor')
  const parsed = nameSchema.parse(name)

  await db.update(blogCategories)
    .set({ name: parsed, description: description?.trim() || null })
    .where(eq(blogCategories.id, id))
  // Keep the denormalized blog_posts.category display name in sync (see schema
  // comment) — public pages read that column directly, no join.
  await db.update(blogPosts).set({ category: parsed }).where(eq(blogPosts.categoryId, id))

  revalidateTaxonomyPaths()
  await logActivity(session.user, { action: 'updated', entityType: 'blog', entityTitle: `Category: ${parsed}`, href: '/admin/blog/categories' })
}

// WP deletes a term without deleting its posts — posts fall back to
// uncategorized. categoryId FK is SET NULL; the denormalized name is cleared
// here in the same spirit.
export async function deleteBlogCategory(id: number) {
  const session = await requireRole('admin')
  const [cat] = await db.select({ name: blogCategories.name }).from(blogCategories).where(eq(blogCategories.id, id))
  if (!cat) return
  await db.update(blogPosts).set({ category: null }).where(eq(blogPosts.categoryId, id))
  await db.delete(blogCategories).where(eq(blogCategories.id, id))
  revalidateTaxonomyPaths()
  await logActivity(session.user, { action: 'deleted', entityType: 'blog', entityTitle: `Category: ${cat.name}` })
}

export async function deleteBlogTag(id: number) {
  const session = await requireRole('admin')
  const [tag] = await db.select({ name: blogTags.name }).from(blogTags).where(eq(blogTags.id, id))
  if (!tag) return
  // blog_post_tags rows cascade with the FK.
  await db.delete(blogTags).where(eq(blogTags.id, id))
  revalidateTaxonomyPaths()
  await logActivity(session.user, { action: 'deleted', entityType: 'blog', entityTitle: `Tag: ${tag.name}` })
}
