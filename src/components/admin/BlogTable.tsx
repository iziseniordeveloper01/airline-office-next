'use client'

import Link from 'next/link'
import { trashBlogPost } from '@/app/admin/blog/actions'
import DeleteButton from '@/components/admin/DeleteButton'
import StatusBadge from '@/components/admin/StatusBadge'

interface BlogEntry {
  id: number
  slug: string
  title: string
  category: string
  author: string
  status: 'draft' | 'published' | 'scheduled'
  publishedAt: string
  readingTime: string
}

export default function BlogTable({ posts }: { posts: BlogEntry[] }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} posts total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/blog/trash" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Trash
          </Link>
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-4">Title</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-1">Status</span>
          <span className="col-span-2">Published</span>
          <span className="col-span-1">Read Time</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {/* Empty */}
        {posts.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-sm">No blog posts yet.</p>
            <Link href="/admin/blog/new" className="text-indigo-600 text-sm mt-1 inline-block hover:underline">
              Create your first post →
            </Link>
          </div>
        )}

        {/* Rows */}
        {posts.map((post, i) => (
          <div
            key={post.slug}
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center ${
              i < posts.length - 1 ? 'border-b border-gray-100' : ''
            } hover:bg-gray-50 transition-colors`}
          >
            <div className="col-span-4">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{post.slug}</p>
            </div>
            <div className="col-span-2">
              <span className="inline-block text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                {post.category}
              </span>
            </div>
            <div className="col-span-1">
              <StatusBadge status={post.status} />
            </div>
            <div className="col-span-2 text-sm text-gray-500">{post.publishedAt}</div>
            <div className="col-span-1 text-sm text-gray-500">{post.readingTime}</div>
            <div className="col-span-2 flex justify-end gap-2">
              {/* Preview */}
              <a
                href={`/blog/${post.slug}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Live preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              {/* Edit */}
              <Link
                href={`/admin/blog/${post.slug}`}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
              {/* Trash */}
              <DeleteButton
                action={trashBlogPost.bind(null, post.id)}
                confirmMessage={`Move "${post.title}" to trash?`}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </DeleteButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
