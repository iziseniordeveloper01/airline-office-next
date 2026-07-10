'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { trashBlogPost } from '@/app/admin/blog/actions'
import StatusBadge from '@/components/admin/StatusBadge'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { blogPreviewHref } from '@/lib/previewHref'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase()
    return p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      {/* Header — matches the Offices/Airlines admin tables */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">{posts.length} posts total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/blog/trash" className="text-sm text-muted-foreground hover:text-destructive">
            Trash
          </Link>
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4" /> New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or category…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Read Time</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No blog posts found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((post) => (
              <TableRow key={post.slug}>
                <TableCell>
                  <p className="line-clamp-1 font-medium">{post.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">{post.slug}</p>
                </TableCell>
                <TableCell>
                  {post.category ? (
                    <Badge variant="secondary">{post.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell><StatusBadge status={post.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{post.publishedAt || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{post.readingTime || '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm">
                      <a href={blogPreviewHref(post.status, post.slug)} target="_blank" rel="noopener noreferrer" title="Preview">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link href={`/admin/blog/${post.slug}`} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <ConfirmButton
                      title="Move to trash?"
                      description={`"${post.title}" will be removed from the public site and the main list. You can restore it from Trash later.`}
                      confirmLabel="Trash"
                      successMessage="Post trashed"
                      errorMessage="Failed to trash post"
                      action={async () => {
                        await trashBlogPost(post.id)
                        router.refresh()
                      }}
                      trigger={
                        <Button variant="ghost" size="icon-sm" title="Trash">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
