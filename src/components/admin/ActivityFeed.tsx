'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Newspaper,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  Settings,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import type { ActivityRow } from '@/lib/data/getActivity'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  rows: ActivityRow[]
  total: number
  page: number
  pageSize: number
  query: { action: string; entityType: string }
}

const ALL = '__all__'

const ACTION_META: Record<string, { verb: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  created: { verb: 'created', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: Plus },
  updated: { verb: 'updated', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: Pencil },
  trashed: { verb: 'trashed', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', icon: Trash2 },
  restored: { verb: 'restored', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: RotateCcw },
  deleted: { verb: 'deleted', className: 'bg-destructive/10 text-destructive', icon: Trash2 },
  published: { verb: 'published', className: 'bg-primary/10 text-primary', icon: Plus },
  unpublished: { verb: 'unpublished', className: 'bg-muted text-muted-foreground', icon: Pencil },
}

const ENTITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  office: Building2,
  airline: Plane,
  blog: Newspaper,
  user: UserIcon,
  settings: Settings,
  media: ImageIcon,
}

function dayLabel(iso: string | null) {
  if (!iso) return 'Unknown'
  const d = new Date(iso)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function ActivityFeed({ rows, total, page, pageSize, query }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const updateParams = (partial: Record<string, string>) => {
    const params = new URLSearchParams({ action: query.action, entityType: query.entityType, page: String(page), ...partial })
    for (const [k, v] of [...params.entries()]) if (!v || v === ALL) params.delete(k)
    router.push(`${pathname}?${params.toString()}`)
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  // Group consecutive rows by day for section headers.
  const groups: { label: string; items: ActivityRow[] }[] = []
  for (const row of rows) {
    const label = dayLabel(row.createdAt)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(row)
    else groups.push({ label, items: [row] })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={query.action || ALL} onValueChange={(v) => updateParams({ action: v, page: '1' })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All actions</SelectItem>
            {Object.keys(ACTION_META).map((a) => (
              <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={query.entityType || ALL} onValueChange={(v) => updateParams({ entityType: v, page: '1' })}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {Object.keys(ENTITY_ICON).map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">{total} event{total === 1 ? '' : 's'}</span>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm font-medium">No activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Changes made in the admin panel will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group.label}</h2>
              <ol className="relative space-y-1 border-l pl-6">
                {group.items.map((row) => {
                  const meta = ACTION_META[row.action] ?? ACTION_META.updated
                  const EntityIcon = ENTITY_ICON[row.entityType] ?? Pencil
                  return (
                    <li key={row.id} className="relative">
                      <span className={cn('absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background', meta.className)}>
                        <meta.icon className="h-3 w-3" />
                      </span>
                      <div className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <Avatar className="mt-0.5 h-6 w-6">
                            <AvatarFallback className="bg-muted text-[10px] font-semibold">
                              {(row.userName || '?').slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm leading-relaxed">
                            <span className="font-medium">{row.userName || 'Someone'}</span>{' '}
                            <span className="text-muted-foreground">{meta.verb}</span>{' '}
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <EntityIcon className="h-3.5 w-3.5" />
                              {row.entityType}
                            </span>{' '}
                            {row.entityTitle && (
                              row.href ? (
                                <Link href={row.href} className="font-medium text-primary hover:underline">
                                  {row.entityTitle}
                                </Link>
                              ) : (
                                <span className="font-medium">{row.entityTitle}</span>
                              )
                            )}
                          </p>
                        </div>
                        <time
                          className="shrink-0 text-xs whitespace-nowrap text-muted-foreground"
                          dateTime={row.createdAt ?? undefined}
                          title={row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
                          suppressHydrationWarning
                        >
                          {row.createdAt ? formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }) : ''}
                        </time>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
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
    </div>
  )
}
