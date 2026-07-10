'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { trashAirline } from '@/app/admin/airlines/actions'
import StatusBadge from '@/components/admin/StatusBadge'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { airlinePreviewHref } from '@/lib/previewHref'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface AirlineEntry {
  id: number
  slug: string
  name: string
  iataCode: string
  icaoCode: string
  alliance: string
  status: 'draft' | 'published' | 'scheduled'
  isFeatured: boolean
  updatedAt: string
}

export default function AirlinesTable({ airlines }: { airlines: AirlineEntry[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = airlines.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      a.iataCode.toLowerCase().includes(q) ||
      a.icaoCode.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      {/* Header — matches the Offices/Blog admin tables */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Airlines</h1>
          <p className="text-sm text-muted-foreground">{airlines.length} airlines total</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/airlines/trash" className="text-sm text-muted-foreground hover:text-destructive">
            Trash
          </Link>
          <Button asChild>
            <Link href="/admin/airlines/new">
              <Plus className="h-4 w-4" /> New Airline
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
          placeholder="Search by name, IATA, or ICAO…"
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>IATA</TableHead>
              <TableHead>ICAO</TableHead>
              <TableHead>Alliance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No airlines found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((airline) => (
              <TableRow key={airline.slug}>
                <TableCell>
                  <p className="font-medium">{airline.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{airline.slug}</p>
                </TableCell>
                <TableCell className="font-mono text-sm">{airline.iataCode || '—'}</TableCell>
                <TableCell className="font-mono text-sm">{airline.icaoCode || '—'}</TableCell>
                <TableCell>{airline.alliance || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell><StatusBadge status={airline.status} /></TableCell>
                <TableCell>
                  {airline.isFeatured ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600" title="Featured">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Featured
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon-sm">
                      <a href={airlinePreviewHref(airline.status, airline.slug)} target="_blank" rel="noopener noreferrer" title="Preview">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button asChild variant="ghost" size="icon-sm">
                      <Link href={`/admin/airlines/${airline.slug}`} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <ConfirmButton
                      title="Move to trash?"
                      description={`"${airline.name}" will be removed from the public site and the main list. You can restore it from Trash later.`}
                      confirmLabel="Trash"
                      successMessage="Airline trashed"
                      errorMessage="Failed to trash airline"
                      action={async () => {
                        await trashAirline(airline.id)
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
