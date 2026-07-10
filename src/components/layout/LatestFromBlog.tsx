import Link from 'next/link'
import Image from 'next/image'
import { getLatestPosts } from '@/lib/data/getBlog'
import { formatDate } from '@/lib/datetime'

export default async function LatestFromBlog() {
  const posts = await getLatestPosts(3)

  if (posts.length === 0) return null

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-base font-semibold text-blue-800">From the Blog</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Travel Guides &amp; Airline Updates
          </h2>
          <p className="mt-4 text-base text-gray-600">
            Practical guides on airline services, airport terminals, baggage rules and
            everything in between.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}/`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                {post.featuredImage && (
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 rounded-full bg-blue-800 px-2.5 py-1 text-xs font-medium text-white">
                    {post.category}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-semibold leading-6 text-gray-900 line-clamp-2 group-hover:text-blue-800 transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-5 text-gray-500 line-clamp-2">
                  {post.excerpt}
                </p>
                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-gray-400">
                  <span>{formatDate(post.publishedAt)}</span>
                  {post.readingTime && (
                    <>
                      <span>·</span>
                      <span>{post.readingTime} read</span>
                    </>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-md bg-blue-800 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
          >
            View All Posts →
          </Link>
        </div>
      </div>
    </section>
  )
}
