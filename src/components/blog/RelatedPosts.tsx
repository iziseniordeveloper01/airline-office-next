import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/datetime'
import type { BlogPostIndex } from '@/types'

interface Props {
  posts: BlogPostIndex[]
}

export default function RelatedPosts({ posts }: Props) {
  if (!posts || posts.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Related Articles
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}/`}
            className="group block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all duration-200"
          >
            {/* Thumbnail */}
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
              {/* Category badge */}
              <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {post.category}
              </span>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-5 mb-2 line-clamp-2">
                {post.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(post.publishedAt)}</span>
                <span>·</span>
                <span>{post.readingTime} read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}