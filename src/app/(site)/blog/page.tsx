import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getAllBlogPosts } from '@/lib/data/getBlog'
import { getSidebarData } from '@/lib/data/getSidebar'
import BlogSidebar from '@/components/blog/BlogSidebar'

export const metadata: Metadata = {
  title: 'Blog | Airline Office Directory',
  description:
    'Airline travel guides, safety tips, airport terminals, and more. Stay updated with the latest aviation news.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/`,
  },
}

export const revalidate = 3600 // 1 hour

export default async function BlogPage() {
  const [posts, sidebarData] = await Promise.all([
    getAllBlogPosts(),
    getSidebarData(),
  ])

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="bg-indigo-700 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-1">Blog</h1>
          <p className="text-indigo-200 text-sm">
            Travel guides, airline tips, airport info & more
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Posts Grid ── */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}/`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                >
                  {/* Featured Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {post.featuredImage && (
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    )}
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-6 mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-5 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {post.author}
                        </span>
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{post.publishedAt}</span>
                        <span>·</span>
                        <span>{post.readingTime} read</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {posts.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg">No blog posts yet.</p>
              </div>
            )}
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