'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, RotateCcw, Search, Trash2 } from 'lucide-react'
import { bulkRestoreOffices, bulkDeleteOfficesPermanently, restoreOffice, deleteOfficePermanently } from '@/app/admin/offices/actions'
import StatusBadge from '@/components/admin/StatusBadge'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export interface OfficeTrashRow {
  id: number
  slug: string
  airlineSlug: string
  airlineName: string
  fullTitle: string
  city: string
  country: string
  status: 'draft' | 'published' | 'scheduled'
  deletedAt: string | null
}

interface Query {
  q: string
  sort: string
  sortDir: string
}

interface Props {
  rows: OfficeTrashRow[]
  total: number
  page: number
  pageSize: number
  query: Query
  canManageTrash: boolean
}

export default function OfficesTrashTable({ rows, total, page, pageSize, query, canManageTrash }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query.q)
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const updateParams = (partial: Record<string, string>) => {
    const params = new URLSearchParams({ q: query.q, sort: query.sort, sortDir: query.sortDir, page: String(page), ...partial })
    for (const [key, value] of [...params.entries()]) {
      if (!value) params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

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

  const columns: ColumnDef<OfficeTrashRow>[] = [
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
    { id: 'location', header: 'Location', cell: ({ row }) => `${row.original.city}, ${row.original.country}` },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    {
      accessorKey: 'deletedAt',
      header: () => (
        <button type="button" onClick={() => toggleSort('updatedAt')} className="flex items-center gap-1 hover:text-foreground">
          Trashed <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (row.original.deletedAt ? new Date(row.original.deletedAt).toLocaleDateString() : '—'),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        if (!canManageTrash) return <span className="text-xs text-muted-foreground">Admin only</span>
        const office = row.original
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              title="Restore"
              onClick={async () => {
                await restoreOffice(office.id)
                router.refresh()
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <ConfirmButton
              title="Delete permanently?"
              description={`"${office.fullTitle}" will be permanently deleted. This cannot be undone.`}
              confirmLabel="Delete permanently"
              successMessage="Office deleted"
              errorMessage="Failed to delete office"
              action={async () => {
                await deleteOfficePermanently(office.id)
                router.refresh()
              }}
              trigger={
                <Button variant="ghost" size="icon-sm" title="Delete permanently">
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
          <h1 className="text-xl font-semibold tracking-tight">Office Trash</h1>
          <p className="text-sm text-muted-foreground">{total} trashed offices</p>
        </div>
        <Link href="/admin/offices" className="text-sm font-medium text-primary hover:underline">
          ← Back to Offices
        </Link>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9" />
      </div>

      {canManageTrash && selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <ConfirmButton
              title={`Restore ${selectedIds.length} offices?`}
              description="They'll reappear in the main list and (if currently live) on the public site."
              confirmLabel="Restore selected"
              successMessage="Offices restored"
              errorMessage="Failed to restore selected offices"
              variant="default"
              action={async () => {
                await bulkRestoreOffices(selectedIds)
                refreshAndClear()
              }}
              trigger={<Button variant="outline" size="sm"><RotateCcw className="h-4 w-4" /> Restore selected</Button>}
            />
            <ConfirmButton
              title={`Permanently delete ${selectedIds.length} offices?`}
              description="This cannot be undone."
              confirmLabel="Delete permanently"
              successMessage="Offices deleted"
              errorMessage="Failed to delete selected offices"
              action={async () => {
                await bulkDeleteOfficesPermanently(selectedIds)
                refreshAndClear()
              }}
              trigger={<Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /> Delete permanently</Button>}
            />
          </div>
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
                  Trash is empty.
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
        <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => updateParams({ page: String(page - 1) })}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= pageCount || isPending} onClick={() => updateParams({ page: String(page + 1) })}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
