import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostsByTagSlug } from '@/lib/data/getBlog'
import { getSidebarData } from '@/lib/data/getSidebar'
import BlogSidebar from '@/components/blog/BlogSidebar'
import PostGrid from '@/components/blog/PostGrid'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getPostsByTagSlug(slug)
  if (!data) return { title: 'Not Found' }
  return {
    title: `Posts tagged “${data.tag.name}” | Airline Office Directory`,
    description: `All blog posts tagged with ${data.tag.name}.`,
    alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/tag/${slug}/` },
  }
}

export default async function BlogTagPage({ params }: Props) {
  const { slug } = await params
  const [data, sidebarData] = await Promise.all([
    getPostsByTagSlug(slug),
    getSidebarData(),
  ])
  if (!data) notFound()

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="bg-blue-800 text-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">Tag</p>
          <h1 className="text-3xl font-bold mb-1">#{data.tag.name}</h1>
          <p className="text-blue-200 text-sm">
            {data.posts.length} article{data.posts.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <PostGrid posts={data.posts} emptyMessage="No posts with this tag yet." />
            <div className="mt-8">
              <Link href="/blog/" className="text-sm font-medium text-blue-800 hover:text-blue-900">
                ← All posts
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <BlogSidebar
                latestPosts={sidebarData.latestPosts}
                latestPages={sidebarData.latestPages}
                popularPages={sidebarData.popularPages}
                topAirlines={sidebarData.topAirlines}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
