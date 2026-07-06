import { getBlogCategories, getBlogTags } from '@/lib/data/getTaxonomy'
import TaxonomyManager from '@/components/admin/TaxonomyManager'

export const dynamic = 'force-dynamic'

export default async function BlogCategoriesPage() {
  const [categories, tags] = await Promise.all([getBlogCategories(), getBlogTags()])
  return <TaxonomyManager categories={categories} tags={tags} />
}
