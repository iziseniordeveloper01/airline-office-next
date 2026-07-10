'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RotateCcw, Trash2 } from 'lucide-react'
import { restoreAirline, deleteAirlinePermanently } from '@/app/admin/airlines/actions'
import ConfirmButton from '@/components/admin/ConfirmButton'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface TrashedAirline {
  id: number
  slug: string
  name: string
  iataCode: string
  deletedAt: string
}

export default function AirlinesTrashTable({
  airlines,
  canManageTrash,
}: {
  airlines: TrashedAirline[]
  canManageTrash: boolean
}) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Airline Trash</h1>
          <p className="text-sm text-muted-foreground">{airlines.length} trashed airlines</p>
        </div>
        <Link href="/admin/airlines" className="text-sm font-medium text-primary hover:underline">
          ← Back to Airlines
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>IATA</TableHead>
              <TableHead>Trashed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {airlines.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Trash is empty.
                </TableCell>
              </TableRow>
            )}
            {airlines.map((airline) => (
              <TableRow key={airline.id}>
                <TableCell className="font-medium">{airline.name}</TableCell>
                <TableCell className="font-mono text-sm">{airline.iataCode || '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{airline.deletedAt}</TableCell>
                <TableCell>
                  {canManageTrash ? (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Restore"
                        onClick={async () => {
                          await restoreAirline(airline.id)
                          router.refresh()
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <ConfirmButton
                        title="Delete permanently?"
                        description={`"${airline.name}" will be permanently deleted. This cannot be undone.`}
                        confirmLabel="Delete permanently"
                        successMessage="Airline deleted"
                        errorMessage="Failed to delete airline"
                        action={async () => {
                          await deleteAirlinePermanently(airline.id)
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
