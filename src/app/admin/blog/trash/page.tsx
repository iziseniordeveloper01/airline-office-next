import { desc, isNotNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { blogPosts } from '@/lib/schema'
import BlogTrashTable from '@/components/admin/BlogTrashTable'

export default async function BlogTrashPage() {
  const [session, rows] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      category: blogPosts.category,
      deletedAt: blogPosts.deletedAt,
    })
      .from(blogPosts)
      .where(isNotNull(blogPosts.deletedAt))
      .orderBy(desc(blogPosts.deletedAt)),
  ])

  const trashed = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category ?? '',
    deletedAt: p.deletedAt?.toISOString().slice(0, 10) ?? '',
  }))

  return <BlogTrashTable posts={trashed} canManageTrash={session?.user?.role !== 'editor'} />
}
