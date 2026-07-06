import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { blogCategories, blogTags, blogPostTags, blogPosts } from '@/lib/schema'

export interface CategoryWithCount {
  id: number
  name: string
  slug: string
  description: string | null
  postCount: number
}

export interface TagWithCount {
  id: number
  name: string
  slug: string
  postCount: number
}

// WP-style "Categories" screen list. Counts include drafts (it's an admin
// screen — editors need to see where everything lives, not just what's live).
export async function getBlogCategories(): Promise<CategoryWithCount[]> {
  const rows = await db
    .select({
      id: blogCategories.id,
      name: blogCategories.name,
      slug: blogCategories.slug,
      description: blogCategories.description,
      postCount: sql<number>`count(${blogPosts.id})`,
    })
    .from(blogCategories)
    .leftJoin(blogPosts, eq(blogPosts.categoryId, blogCategories.id))
    .groupBy(blogCategories.id)
    .orderBy(asc(blogCategories.name))
  return rows.map((r) => ({ ...r, postCount: Number(r.postCount) }))
}

export async function getBlogTags(): Promise<TagWithCount[]> {
  const rows = await db
    .select({
      id: blogTags.id,
      name: blogTags.name,
      slug: blogTags.slug,
      postCount: sql<number>`count(${blogPostTags.postId})`,
    })
    .from(blogTags)
    .leftJoin(blogPostTags, eq(blogPostTags.tagId, blogTags.id))
    .groupBy(blogTags.id)
    .orderBy(asc(blogTags.name))
  return rows.map((r) => ({ ...r, postCount: Number(r.postCount) }))
}

// Tag names for one post — feeds the edit form's chip input.
export async function getPostTagNames(postId: number): Promise<string[]> {
  const rows = await db
    .select({ name: blogTags.name })
    .from(blogPostTags)
    .innerJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
    .where(eq(blogPostTags.postId, postId))
    .orderBy(asc(blogTags.name))
  return rows.map((r) => r.name)
}
