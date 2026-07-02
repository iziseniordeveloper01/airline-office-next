import { eq, and, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { blogPosts, blogFaqs } from '@/lib/schema'
import { notTrashed, isCurrentlyLive } from '@/lib/visibility'
import BlogPostForm from '@/components/admin/BlogPostForm'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), notTrashed(blogPosts)),
  })
  if (!post) notFound()

  const faqs = await db.select().from(blogFaqs)
    .where(eq(blogFaqs.postId, post.id))
    .orderBy(asc(blogFaqs.sortOrder))

  return <BlogPostForm mode="edit" initialData={{ ...post, faqs }} isLive={isCurrentlyLive(post)} />
}
