'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FolderOpen, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import {
  createBlogCategory,
  renameBlogCategory,
  deleteBlogCategory,
  deleteBlogTag,
} from '@/app/admin/blog/taxonomy-actions'
import type { CategoryWithCount, TagWithCount } from '@/lib/data/getTaxonomy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  categories: CategoryWithCount[]
  tags: TagWithCount[]
}

export default function TaxonomyManager({ categories, tags }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const run = (fn: () => Promise<void>, ok: string) =>
    startTransition(async () => {
      try {
        await fn()
        toast.success(ok)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })

  const addCategory = () => {
    if (!newName.trim()) return
    run(async () => {
      await createBlogCategory(newName, newDescription)
      setNewName('')
      setNewDescription('')
    }, 'Category created')
  }

  const startEdit = (cat: CategoryWithCount) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditDescription(cat.description ?? '')
  }

  const saveEdit = () => {
    if (editingId == null || !editName.trim()) return
    run(async () => {
      await renameBlogCategory(editingId, editName, editDescription)
      setEditingId(null)
    }, 'Category updated')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Categories &amp; Tags</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize blog posts WordPress-style — one category per post, any number of tags.
        </p>
      </div>

      {/* ── Categories ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" /> Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new */}
          <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
            <div className="min-w-40 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Flight Delays"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }} />
            </div>
            <div className="min-w-52 flex-[2]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description (optional)</label>
              <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Shown on the category archive page" />
            </div>
            <Button onClick={addCategory} disabled={pending || !newName.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {/* List */}
          <div className="divide-y rounded-lg border">
            {categories.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">No categories yet.</p>
            )}
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                {editingId === cat.id ? (
                  <>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-48"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit() } }} autoFocus />
                    <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" className="flex-1" />
                    <Button size="sm" onClick={saveEdit} disabled={pending}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{cat.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">/blog/category/{cat.slug}/</span>
                      </div>
                      {cat.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{cat.description}</p>}
                    </div>
                    <Badge variant="secondary">{cat.postCount} {cat.postCount === 1 ? 'post' : 'posts'}</Badge>
                    <Button size="icon-sm" variant="ghost" onClick={() => startEdit(cat)} aria-label={`Edit ${cat.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon-sm" variant="ghost" className="text-destructive hover:text-destructive" aria-label={`Delete ${cat.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete “{cat.name}”?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {cat.postCount > 0
                              ? `${cat.postCount} post(s) will become uncategorized. The posts themselves are not deleted.`
                              : 'This category has no posts.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => run(() => deleteBlogCategory(cat.id), 'Category deleted')}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Tags ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" /> Tags
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tags are created automatically when you add them to a post. Deleting a tag removes it from every post.
          </p>
        </CardHeader>
        <CardContent>
          {tags.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No tags yet — add some in the post editor&apos;s Settings tab.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <AlertDialog key={tag.id}>
                <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 py-1 pl-3 pr-1.5 text-sm">
                  {tag.name}
                  <span className="text-xs text-muted-foreground">({tag.postCount})</span>
                  <AlertDialogTrigger asChild>
                    <button type="button" className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete tag ${tag.name}`}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </AlertDialogTrigger>
                </span>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete tag “{tag.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      It will be removed from {tag.postCount} post(s). Posts are not deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => run(() => deleteBlogTag(tag.id), 'Tag deleted')}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
