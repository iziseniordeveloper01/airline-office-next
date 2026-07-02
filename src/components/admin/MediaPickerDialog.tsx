'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { listMedia } from '@/app/admin/media/actions'
import type { MediaItem } from '@/lib/data/getMedia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const PAGE_SIZE = 24

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (id: string, url: string) => void
}

export default function MediaPickerDialog({ open, onOpenChange, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch on open / search / page change. State is set inside the async closure
  // (not synchronously in the effect body) to satisfy the compiler lint rules.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const t = setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const data = await listMedia(search, page)
          if (!cancelled) {
            setRows(data.rows)
            setTotal(data.total)
          }
        } catch {
          if (!cancelled) {
            setRows([])
            setTotal(0)
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, search ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, search, page])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pick = (item: MediaItem) => {
    onSelect(item.id, `/api/images/${item.id}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose from library</DialogTitle>
          <DialogDescription>Select an existing image to reuse it.</DialogDescription>
        </DialogHeader>

        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by filename…"
        />

        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageOff className="h-7 w-7 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No images found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {rows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item)}
                  title={item.filename ?? ''}
                  className="group aspect-square overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/images/${item.id}`}
                    alt={item.filename ?? ''}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount || loading} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
