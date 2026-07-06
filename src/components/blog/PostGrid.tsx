import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/datetime'
import type { BlogPostIndex } from '@/types'

// Shared card grid for /blog and the category/tag archive pages — one place to
// change the card design. The category badge is plain text (the whole card is
// already a link; nesting another <a> would be invalid HTML).
export default function PostGrid({ posts, emptyMessage = 'No blog posts yet.' }: {
  posts: BlogPostIndex[]
  emptyMessage?: string
}) {
  return (
    <>
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
              {post.category && (
                <span className="absolute top-3 left-3 bg-indigo-600 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {post.category}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-6 mb-2 line-clamp-2">
                {post.title}
              </h2>
              <p className="text-sm text-gray-500 leading-5 mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {post.author ? post.author.charAt(0).toUpperCase() : '?'}
                  </span>
                  <span className="truncate">{post.author}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
                  <span>{formatDate(post.publishedAt)}</span>
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
          <p className="text-lg">{emptyMessage}</p>
        </div>
      )}
    </>
  )
}
