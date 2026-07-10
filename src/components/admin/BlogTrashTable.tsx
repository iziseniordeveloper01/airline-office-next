'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2 } from 'lucide-react'
import { restoreBlogPost, deleteBlogPostPermanently } from '@/app/admin/blog/actions'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Blog Trash</h1>
          <p className="text-sm text-muted-foreground">{posts.length} trashed post{posts.length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/admin/blog" className="text-sm font-medium text-primary hover:underline">
          ← Back to Blog
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Trashed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Trash is empty.
                </TableCell>
              </TableRow>
            )}
            {posts.map((post) => (
              <TableRow key={post.id}>
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
                <TableCell className="text-sm text-muted-foreground">{post.deletedAt}</TableCell>
                <TableCell>
                  {canManageTrash ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Restore"
                        onClick={async () => {
                          await restoreBlogPost(post.id)
                          router.refresh()
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <ConfirmButton
                        title="Delete permanently?"
                        description={`"${post.title}" will be permanently deleted. This cannot be undone.`}
                        confirmLabel="Delete permanently"
                        successMessage="Post deleted"
                        errorMessage="Failed to delete post"
                        action={async () => {
                          await deleteBlogPostPermanently(post.id)
                          router.refresh()
                        }}
                        trigger={
                          <Button variant="ghost" size="icon-sm" title="Delete permanently">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    </div>
                  ) : (
                    <span className="flex justify-end text-xs text-muted-foreground">Admin only</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
