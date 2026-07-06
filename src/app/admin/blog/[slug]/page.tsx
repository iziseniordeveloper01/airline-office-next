import { eq, and, asc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { blogPosts, blogFaqs } from '@/lib/schema'
import { notTrashed, isCurrentlyLive } from '@/lib/visibility'
import { getBlogCategories, getPostTagNames } from '@/lib/data/getTaxonomy'
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

  const [faqs, categories, initialTags] = await Promise.all([
    db.select().from(blogFaqs).where(eq(blogFaqs.postId, post.id)).orderBy(asc(blogFaqs.sortOrder)),
    getBlogCategories(),
    getPostTagNames(post.id),
  ])

  return (
    <BlogPostForm
      mode="edit"
      initialData={{ ...post, faqs }}
      categories={categories}
      initialTags={initialTags}
      isLive={isCurrentlyLive(post)}
    />
  )
}
