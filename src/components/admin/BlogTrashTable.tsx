'use client'

import Link from 'next/link'
import { restoreBlogPost, deleteBlogPostPermanently } from '@/app/admin/blog/actions'
import DeleteButton from '@/components/admin/DeleteButton'

interface TrashedPost {
  id: number
  slug: string
  title: string
  category: string
  deletedAt: string
}

export default function BlogTrashTable({
  posts,
  canManageTrash,
}: {
  posts: TrashedPost[]
  canManageTrash: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Blog Trash</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.length} trashed post{posts.length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/admin/blog" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          ← Back to Blog
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span className="col-span-6">Title</span>
          <span className="col-span-2">Category</span>
          <span className="col-span-2">Trashed</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {posts.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Trash is empty</div>}

        {posts.map((post, i) => (
          <div
            key={post.id}
            className={`grid grid-cols-12 gap-4 px-5 py-4 items-center ${i < posts.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
          >
            <div className="col-span-6">
              <p className="text-sm font-medium text-gray-900 line-clamp-1">{post.title}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{post.slug}</p>
            </div>
            <div className="col-span-2 text-sm text-gray-500">{post.category}</div>
            <div className="col-span-2 text-xs text-gray-400">{post.deletedAt}</div>
            <div className="col-span-2 flex justify-end gap-2">
              {canManageTrash ? (
                <>
                  <DeleteButton
                    action={restoreBlogPost.bind(null, post.id)}
                    confirmMessage={`Restore "${post.title}"?`}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Restore
                  </DeleteButton>
                  <DeleteButton
                    action={deleteBlogPostPermanently.bind(null, post.id)}
                    confirmMessage={`Permanently delete "${post.title}"? This cannot be undone.`}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Delete Permanently
                  </DeleteButton>
                </>
              ) : (
                <span className="text-xs text-gray-400">Admin only</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
