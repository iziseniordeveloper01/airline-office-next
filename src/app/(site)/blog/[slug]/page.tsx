import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getBlogPost, getAllBlogSlugs, getRelatedPosts } from '@/lib/data/getBlog'
import { getSidebarData } from '@/lib/data/getSidebar'
import BlogSidebar from '@/components/blog/BlogSidebar'
import BlogFAQ from '@/components/blog/BlogFAQ'
import RelatedPosts from '@/components/blog/RelatedPosts'

interface Props {
  params: Promise<{ slug: string }>
}

// Build time pe saare blog slugs se static pages banao
export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map((s) => ({ slug: s.slug }))
}

export const revalidate = 86400 // 24 hours
// A scheduled post that's already due is excluded from generateStaticParams (it
// wasn't visible yet at the last build/regenerate), so it must render on-demand the
// first time its URL is requested — dynamicParams must stay true for that to work.
export const dynamicParams = true

// Dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
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

  const [post, sidebarData] = await Promise.all([
    getBlogPost(slug),
    getSidebarData(),
  ])

  if (!post) notFound()

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* ── Hero / Featured Image ── */}
        <div className="relative w-full h-64 md:h-80 bg-indigo-900 overflow-hidden">
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
          <div className="relative z-10 max-w-6xl mx-auto px-4 h-full flex flex-col justify-end pb-8">
            {/* Breadcrumb */}
            <nav className="text-indigo-200 text-sm mb-3 flex items-center gap-1.5">
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
              <span>›</span>
              <Link href="/blog/" className="hover:text-white transition-colors">
                Blog
              </Link>
              <span>›</span>
              <span className="text-white truncate max-w-xs">{post.title}</span>
            </nav>
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight max-w-3xl">
              {post.title}
            </h1>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ────────── LEFT: Article Content ────────── */}
            <article className="flex-1 min-w-0">
              {/* Post Meta (Author, Date, Reading Time) */}
              <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
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
                  <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                </div>

                {/* Reading Time */}
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{post.readingTime} read</span>
                </div>

                {/* Category */}
                <span className="ml-auto bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>

              {/* ── Article Body ── */}
              <div
                className="prose-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

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