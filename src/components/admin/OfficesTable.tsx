'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { trashOffice, bulkTrashOffices } from '@/app/admin/offices/actions'
import StatusBadge from '@/components/admin/StatusBadge'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { officePreviewHref } from '@/lib/previewHref'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface OfficeRow {
  id: number
  slug: string
  airlineSlug: string
  airlineName: string
  fullTitle: string
  city: string
  country: string
  status: 'draft' | 'published' | 'scheduled'
  updatedAt: string | null
}

interface Query {
  q: string
  airline: string
  status: string
  sort: string
  sortDir: string
}

interface Props {
  rows: OfficeRow[]
  total: number
  page: number
  pageSize: number
  airlines: { slug: string; name: string }[]
  query: Query
}

const ALL = '__all__'

export default function OfficesTable({ rows, total, page, pageSize, airlines, query }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query.q)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const updateParams = (partial: Record<string, string>) => {
    const params = new URLSearchParams({
      q: query.q,
      airline: query.airline,
      status: query.status,
      sort: query.sort,
      sortDir: query.sortDir,
      page: String(page),
      ...partial,
    })
    for (const [key, value] of [...params.entries()]) {
      if (!value || value === ALL) params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Debounced search — resets to page 1 on every new query.
  useEffect(() => {
    if (search === query.q) return
    const timer = setTimeout(() => updateParams({ q: search, page: '1' }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleSort = (column: string) => {
    const sortDir = query.sort === column && query.sortDir === 'asc' ? 'desc' : 'asc'
    updateParams({ sort: column, sortDir })
  }

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]).map(Number)

  const refreshAndClear = () => {
    setRowSelection({})
    startTransition(() => router.refresh())
  }

  const columns: ColumnDef<OfficeRow>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
      ),
    },
    {
      accessorKey: 'fullTitle',
      header: () => (
        <button type="button" onClick={() => toggleSort('fullTitle')} className="flex items-center gap-1 hover:text-foreground">
          Title <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="line-clamp-1 font-medium">{row.original.fullTitle}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    { accessorKey: 'airlineName', header: 'Airline' },
    {
      id: 'location',
      header: 'Location',
      cell: ({ row }) => `${row.original.city}, ${row.original.country}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'updatedAt',
      header: () => (
        <button type="button" onClick={() => toggleSort('updatedAt')} className="flex items-center gap-1 hover:text-foreground">
          Updated <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleDateString() : '—'),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const office = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button asChild variant="ghost" size="icon-sm">
              <a href={officePreviewHref(office.status, office.airlineSlug, office.slug)} target="_blank" rel="noopener noreferrer" title="Preview">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="ghost" size="icon-sm">
              <Link href={`/admin/offices/${office.airlineSlug}/${office.slug}`} title="Edit">
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <ConfirmButton
              title="Move to trash?"
              description={`"${office.fullTitle}" will be removed from the public site and the main list. You can restore it from Trash later.`}
              confirmLabel="Trash"
              successMessage="Office trashed"
              errorMessage="Failed to trash office"
              action={async () => {
                await trashOffice(office.id)
                router.refresh()
              }}
              trigger={
                <Button variant="ghost" size="icon-sm" title="Trash">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              }
            />
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: rows,
    columns,
    getRowId: (row) => String(row.id),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Offices</h1>
          <p className="text-sm text-muted-foreground">{total} offices total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/offices/trash" className="text-sm text-muted-foreground hover:text-destructive">
            Trash
          </Link>
          <Button asChild>
            <Link href="/admin/offices/new">
              <Plus className="h-4 w-4" /> New Office
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, city, country…"
            className="pl-9"
          />
        </div>
        <Select value={query.airline || ALL} onValueChange={(v) => updateParams({ airline: v, page: '1' })}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Airlines" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Airlines</SelectItem>
            {airlines.map((a) => <SelectItem key={a.slug} value={a.slug}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={query.status || ALL} onValueChange={(v) => updateParams({ status: v, page: '1' })}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm">{selectedIds.length} selected</span>
          <ConfirmButton
            title={`Move ${selectedIds.length} offices to trash?`}
            description="They'll be removed from the public site and the main list. You can restore them from Trash later."
            confirmLabel="Trash selected"
            successMessage="Offices trashed"
            errorMessage="Failed to trash selected offices"
            action={async () => {
              await bulkTrashOffices(selectedIds)
              refreshAndClear()
            }}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" /> Trash selected
              </Button>
            }
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No offices found.
                </TableCell>
              </TableRow>
            )}
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isPending}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount || isPending}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
