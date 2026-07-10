import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostIndex, AirlineIndex } from '@/types'

interface SidebarProps {
  latestPosts: BlogPostIndex[]
  latestPages: { airlineSlug: string; slug: string; updatedAt: string }[]
  popularPages: { title: string; url: string; city: string }[]
  topAirlines: AirlineIndex[]
}

// ── Widget Wrapper ─────────────────────────────────────────────────────────
function Widget({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
      {/* Widget Header */}
      <div className="bg-blue-800 px-5 py-3">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
          {title}
        </h3>
      </div>
      {/* Widget Body */}
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Latest Blog Posts Widget ───────────────────────────────────────────────
function LatestPostsWidget({ posts }: { posts: BlogPostIndex[] }) {
  return (
    <Widget title="Latest Blog Posts">
      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}/`}
              className="flex gap-3 group items-start"
            >
              {/* Thumbnail */}
              <div className="relative w-16 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {post.featuredImage && (
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="64px"
                  />
                )}
              </div>
              {/* Title */}
              <span className="text-sm text-gray-700 group-hover:text-blue-800 leading-5 transition-colors line-clamp-3">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

// ── Latest Office Pages Widget ─────────────────────────────────────────────
function LatestPagesWidget({
  pages,
}: {
  pages: { airlineSlug: string; slug: string; updatedAt: string }[]
}) {
  // Slug ko readable title mein convert karo
  const toTitle = (slug: string) =>
    slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <Widget title="Latest Pages">
      <ul className="space-y-2">
        {pages.map((page) => (
          <li key={`${page.airlineSlug}-${page.slug}`}>
            <Link
              href={`/${page.airlineSlug}/${page.slug}/`}
              className="flex items-start gap-2 group"
            >
              {/* Location icon */}
              <svg
                className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm text-gray-700 group-hover:text-blue-800 leading-5 transition-colors">
                {toTitle(page.airlineSlug)} {toTitle(page.slug)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

// ── Popular Pages Widget ───────────────────────────────────────────────────
function PopularPagesWidget({
  pages,
}: {
  pages: { title: string; url: string; city: string }[]
}) {
  return (
    <Widget title="Popular Pages">
      <ul className="space-y-2">
        {pages.map((page) => (
          <li key={page.url}>
            <Link
              href={page.url}
              className="flex items-start gap-2 group"
            >
              <svg
                className="w-4 h-4 mt-0.5 text-orange-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div>
                <span className="text-sm text-gray-700 group-hover:text-blue-800 leading-5 transition-colors block">
                  {page.title}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

// ── Top Airlines Widget ────────────────────────────────────────────────────
function TopAirlinesWidget({ airlines }: { airlines: AirlineIndex[] }) {
  return (
    <Widget title="Top Airlines">
      <ul className="space-y-2">
        {airlines.map((airline) => (
          <li key={airline.slug}>
            <Link
              href={`/${airline.slug}/`}
              className="flex items-center gap-3 group"
            >
              {/* IATA Badge */}
              <span className="inline-flex items-center justify-center w-10 h-7 rounded bg-blue-50 text-blue-800 font-bold text-xs flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                {airline.iataCode}
              </span>
              <span className="text-sm text-gray-700 group-hover:text-blue-800 transition-colors">
                {airline.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  )
}

// ── Main Sidebar Export ────────────────────────────────────────────────────
export default function BlogSidebar({
  latestPosts,
  latestPages,
  popularPages,
  topAirlines,
}: SidebarProps) {
  return (
    <aside className="w-full">
      <LatestPostsWidget posts={latestPosts} />
      <LatestPagesWidget pages={latestPages} />
      <PopularPagesWidget pages={popularPages} />
      <TopAirlinesWidget airlines={topAirlines} />
    </aside>
  )
}