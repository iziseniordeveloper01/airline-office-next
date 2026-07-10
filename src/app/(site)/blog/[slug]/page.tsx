import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getBlogPost, getBlogPostForPreview, getRelatedPosts } from '@/lib/data/getBlog'
import { getSidebarData } from '@/lib/data/getSidebar'
import { canPreviewDrafts } from '@/lib/draftPreview'
import { getRedirectTarget } from '@/lib/redirects'
import { formatDate } from '@/lib/datetime'
import { jsonLd as toJsonLd } from '@/lib/utils'
import Breadcrumb from '@/components/layout/Breadcrumb'
import BlogSidebar from '@/components/blog/BlogSidebar'
import BlogFAQ from '@/components/blog/BlogFAQ'
import RelatedPosts from '@/components/blog/RelatedPosts'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

// Dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let post = await getBlogPost(slug)
  if (!post && (await canPreviewDrafts())) post = await getBlogPostForPreview(slug)
  if (!post) return { title: 'Not Found' }

  const title = post.metaTitle || post.title
  return {
    title,
    description: post.metaDescription || post.excerpt || undefined,
    robots: post.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.ogImage ? [{ url: post.ogImage }] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
    },
    alternates: {
      canonical: post.canonicalUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}/`,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  // Checked before the content lookup, not just on a 404 — an admin-added
  // redirect must win even while the post it points away from is still live.
  const target = await getRedirectTarget(`/blog/${slug}`)
  if (target) permanentRedirect(target)

  const [postResult, sidebarData] = await Promise.all([
    getBlogPost(slug),
    getSidebarData(),
  ])

  const post = postResult ?? ((await canPreviewDrafts()) ? await getBlogPostForPreview(slug) : null)
  if (!post) {
    notFound()
  }

  // Related posts fetch karo
  const relatedPosts = await getRelatedPosts(post.relatedPosts || [])

  // Article JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: post.ogImage,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'AirlinesOfficeList',
      url: process.env.NEXT_PUBLIC_SITE_URL,
    },
  }

  return (
    <>
      {/* Article SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(jsonLd) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* ── Hero / Featured Image ── */}
        <div className="relative w-full h-64 md:h-80 bg-blue-950 overflow-hidden">
          {post.featuredImage && (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              priority
              className="object-cover opacity-40"
              sizes="100vw"
            />
          )}
          {/* Title Overlay */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 h-full flex flex-col justify-end pb-8">
            {/* Breadcrumb */}
            <Breadcrumb
              tone="dark"
              className="mb-3"
              items={[
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/blog/' },
                { label: post.title },
              ]}
            />
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight max-w-3xl">
              {post.title}
            </h1>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ────────── LEFT: Article Content ────────── */}
            <article className="flex-1 min-w-0">
              {/* Post Meta (Author, Date, Reading Time) */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-800 text-white flex items-center justify-center text-sm font-bold">
                    {post.author[0]}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {post.author}
                  </span>
                </div>

                {/* Divider */}
                <span className="text-gray-300">|</span>

                {/* Published Date */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                </div>

                {/* Reading Time */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{post.readingTime} read</span>
                </div>

                {/* Category — links to its archive when we know the slug */}
                {post.categorySlug ? (
                  <Link
                    href={`/blog/category/${post.categorySlug}/`}
                    className="ml-auto bg-blue-50 text-blue-800 text-xs font-medium px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {post.category}
                  </Link>
                ) : (
                  post.category && (
                    <span className="ml-auto bg-blue-50 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                  )
                )}
              </div>

              {/* ── Article Body ── */}
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* ── Tags ── */}
              {post.tags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-6">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tags:</span>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/blog/tag/${tag.slug}/`}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── FAQ Section ── */}
              <BlogFAQ faqs={post.faqs} />

              {/* ── Related Posts ── */}
              <RelatedPosts posts={relatedPosts} />
            </article>

            {/* ────────── RIGHT: Sticky Sidebar ────────── */}
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
      </div>
    </>
  )
}