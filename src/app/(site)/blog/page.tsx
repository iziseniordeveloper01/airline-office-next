import type { Metadata } from 'next'
import { getAllBlogPosts } from '@/lib/data/getBlog'
import { getSidebarData } from '@/lib/data/getSidebar'
import BlogSidebar from '@/components/blog/BlogSidebar'
import PostGrid from '@/components/blog/PostGrid'

export const metadata: Metadata = {
  title: 'Blog | Airline Office Directory',
  description:
    'Airline travel guides, safety tips, airport terminals, and more. Stay updated with the latest aviation news.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/`,
  },
}

// Rendered at runtime, not at build: Railway's build phase can't reach the
// private mysql.railway.internal host, so any build-time DB read fails. This
// reads posts per request instead of prerendering at build.
export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const [posts, sidebarData] = await Promise.all([
    getAllBlogPosts(),
    getSidebarData(),
  ])

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-indigo-700 text-white py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-1">Blog</h1>
          <p className="text-indigo-200 text-sm">
            Travel guides, airline tips, airport info & more
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Posts Grid ── */}
          <div className="flex-1 min-w-0">
            <PostGrid posts={posts} />
          </div>

          {/* ── Sidebar ── */}
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