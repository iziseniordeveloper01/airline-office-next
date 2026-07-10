'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { createManualRedirect, deleteRedirect } from '@/app/admin/redirects/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export interface RedirectRow {
  id: number
  fromPath: string
  toPath: string
  createdAt: string
}

export default function RedirectsManager({ redirects }: { redirects: RedirectRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [fromPath, setFromPath] = useState('')
  const [toPath, setToPath] = useState('')

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

  const addRedirect = () => {
    if (!fromPath.trim() || !toPath.trim()) return
    run(async () => {
      await createManualRedirect(fromPath.trim(), toPath.trim())
      setFromPath('')
      setToPath('')
    }, 'Redirect added')
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Redirects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renaming an airline, office, or blog post slug adds a 301 here automatically so the old URL keeps working.
          You can also add one manually below. Only paths shaped like <code className="rounded bg-muted px-1 py-0.5 text-xs">/airline-slug</code>,{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/airline-slug/office-slug</code>, or{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/blog/post-slug</code> are ever checked by the public site.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a redirect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3">
            <div className="min-w-48 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From path</label>
              <Input
                value={fromPath}
                onChange={(e) => setFromPath(e.target.value)}
                placeholder="/old-airline-slug"
                className="font-mono text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRedirect() } }}
              />
            </div>
            <div className="min-w-48 flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To path</label>
              <Input
                value={toPath}
                onChange={(e) => setToPath(e.target.value)}
                placeholder="/new-airline-slug"
                className="font-mono text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRedirect() } }}
              />
            </div>
            <Button onClick={addRedirect} disabled={pending || !fromPath.trim() || !toPath.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="divide-y rounded-lg border bg-background">
        {redirects.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">No redirects yet.</p>
        )}
        {redirects.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 font-mono text-sm">
              <span className="truncate">{r.fromPath}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{r.toPath}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="shrink-0 text-destructive hover:text-destructive" aria-label={`Delete redirect ${r.fromPath}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this redirect?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Visitors to <span className="font-mono">{r.fromPath}</span> will get a 404 instead of being sent to <span className="font-mono">{r.toPath}</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => run(() => deleteRedirect(r.id), 'Redirect deleted')}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>
    </div>
  )
}
