import BlogPostForm from '@/components/admin/BlogPostForm'
import { getBlogCategories } from '@/lib/data/getTaxonomy'

export const dynamic = 'force-dynamic'

export default async function NewBlogPostPage() {
  const categories = await getBlogCategories()
  return <BlogPostForm mode="new" categories={categories} />
}
