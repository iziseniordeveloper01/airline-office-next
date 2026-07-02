import { db } from '@/lib/db'
import { blogPosts } from '@/lib/schema'
import { notTrashed } from '@/lib/visibility'
import BlogTable from '@/components/admin/BlogTable'

export default async function AdminBlogPage() {
  const rows = await db.query.blogPosts.findMany({
    where: notTrashed(blogPosts),
    orderBy: (b, { desc }) => [desc(b.publishedAt)],
  })

  const posts = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category ?? '',
    author: p.author ?? '',
    status: p.status,
    publishedAt: (p.publishedAt ?? p.scheduledAt)?.toISOString().slice(0, 10) ?? '',
    readingTime: p.readingTime ?? '',
  }))

  return <BlogTable posts={posts} />
}
