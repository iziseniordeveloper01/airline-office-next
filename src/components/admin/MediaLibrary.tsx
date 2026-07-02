'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Copy, ImageOff, Link2, Trash2, Upload } from 'lucide-react'
import { uploadImage } from '@/app/admin/upload/actions'
import { deleteMedia, getUsage } from '@/app/admin/media/actions'
import type { ImageUsage, MediaItem } from '@/lib/data/getMedia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Props {
  rows: MediaItem[]
  total: number
  page: number
  pageSize: number
  query: { q: string }
  canDelete: boolean
}

const MAX_FILE_SIZE = 8 * 1024 * 1024

export default function MediaLibrary({ rows, total, page, pageSize, query, canDelete }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query.q)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [detail, setDetail] = useState<MediaItem | null>(null)
  const [usage, setUsage] = useState<ImageUsage | null>(null)
  const [usagePending, startUsage] = useTransition()
  const [deletePending, startDelete] = useTransition()

  const updateParams = (partial: Record<string, string>) => {
    const params = new URLSearchParams({ q: query.q, page: String(page), ...partial })
    for (const [k, v] of [...params.entries()]) if (!v) params.delete(k)
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (search === query.q) return
    const t = setTimeout(() => updateParams({ q: search, page: '1' }), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const list = Array.from(files)
    const tooBig = list.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      toast.error(`“${tooBig.name}” is too large (max 8MB)`)
      return
    }
    setUploading(true)
    let ok = 0
    try {
      for (const file of list) {
        const fd = new FormData()
        fd.append('file', file)
        await uploadImage(fd)
        ok++
      }
      toast.success(`Uploaded ${ok} image${ok > 1 ? 's' : ''}`)
      router.refresh()
    } catch {
      toast.error(ok > 0 ? `Uploaded ${ok}, then failed` : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const openDetail = (item: MediaItem) => {
    setDetail(item)
    setUsage(null)
    startUsage(async () => setUsage(await getUsage(item.id)))
  }

  const copyUrl = (id: string) => {
    const url = `${window.location.origin}/api/images/${id}`
    navigator.clipboard.writeText(url).then(
      () => toast.success('URL copied'),
      () => toast.error('Could not copy')
    )
  }

  const confirmDelete = (item: MediaItem) => {
    startDelete(async () => {
      try {
        await deleteMedia(item.id)
        toast.success('Image deleted')
        setDetail(null)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to delete image')
      }
    })
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename…"
          />
        </div>
        <Button asChild disabled={uploading}>
          <label className="cursor-pointer">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => onFiles(e.target.files)}
              disabled={uploading}
            />
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </label>
        </Button>
      </div>

      {/* Grid */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <ImageOff className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No media yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query.q ? 'No files match your search.' : 'Upload images to build your library.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {rows.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openDetail(item)}
              className="group overflow-hidden rounded-lg bg-muted text-left ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="aspect-square overflow-hidden bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-[length:16px_16px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/images/${item.id}`}
                  alt={item.filename ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium">{item.filename || 'untitled'}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.width && item.height ? `${item.width}×${item.height}` : '—'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {total} image{total === 1 ? '' : 's'} · Page {page} of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => updateParams({ page: String(page + 1) })}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details */}
      <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-2xl">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate pr-8">{detail.filename || 'Untitled image'}</DialogTitle>
                <DialogDescription>Image details and usage.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/images/${detail.id}`} alt={detail.filename ?? ''} className="max-h-64 w-full object-contain" />
                </div>

                <div className="space-y-3 text-sm">
                  <dl className="space-y-2">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="font-medium">{detail.mimeType}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Dimensions</dt>
                      <dd className="font-medium">{detail.width && detail.height ? `${detail.width} × ${detail.height}` : '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Uploaded</dt>
                      <dd className="font-medium">{detail.createdAt ? new Date(detail.createdAt).toLocaleDateString() : '—'}</dd>
                    </div>
                  </dl>

                  <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1.5">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <code className="flex-1 truncate text-xs">/api/images/{detail.id}</code>
                    <Button variant="ghost" size="icon-xs" onClick={() => copyUrl(detail.id)} aria-label="Copy URL">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Usage */}
                  <div className="rounded-lg border p-3">
                    {usagePending || usage === null ? (
                      <p className="text-xs text-muted-foreground">Checking usage…</p>
                    ) : usage.inUse ? (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          In use · {usage.refs.length}
                        </Badge>
                        <ul className="space-y-1">
                          {usage.refs.slice(0, 5).map((r, i) => (
                            <li key={i} className="flex items-center justify-between gap-2 text-xs">
                              <Link href={r.href} className="truncate text-primary hover:underline">
                                {r.type}: {r.title}
                              </Link>
                              <span className="shrink-0 text-muted-foreground">{r.field}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                        Not used — safe to delete
                      </Badge>
                    )}
                  </div>

                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          disabled={usagePending || usage?.inUse || deletePending}
                        >
                          <Trash2 className="h-4 w-4" />
                          {usage?.inUse ? 'Remove references first' : 'Delete image'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this image?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently removes the file. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
                          <Button variant="destructive" disabled={deletePending} onClick={() => confirmDelete(detail)}>
                            {deletePending ? 'Deleting…' : 'Delete'}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
