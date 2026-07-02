'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  Activity,
  Building2,
  CornerDownLeft,
  FileText,
  Image,
  LayoutDashboard,
  Newspaper,
  Plane,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Item = {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  group: 'Search' | 'Navigate' | 'Create'
  run: (router: ReturnType<typeof useRouter>) => void
  keywords?: string
}

const STATIC: Item[] = [
  { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navigate', run: (r) => r.push('/admin') },
  { id: 'nav-offices', label: 'Offices', icon: Building2, group: 'Navigate', run: (r) => r.push('/admin/offices') },
  { id: 'nav-airlines', label: 'Airlines', icon: Plane, group: 'Navigate', run: (r) => r.push('/admin/airlines') },
  { id: 'nav-blog', label: 'Blog', icon: Newspaper, group: 'Navigate', run: (r) => r.push('/admin/blog') },
  { id: 'nav-media', label: 'Media Library', icon: Image, group: 'Navigate', run: (r) => r.push('/admin/media'), keywords: 'images uploads photos files' },
  { id: 'nav-users', label: 'Users', icon: Users, group: 'Navigate', run: (r) => r.push('/admin/users'), keywords: 'roles permissions team' },
  { id: 'nav-activity', label: 'Activity Log', icon: Activity, group: 'Navigate', run: (r) => r.push('/admin/activity'), keywords: 'audit history events changes' },
  { id: 'nav-settings', label: 'Settings', icon: Settings, group: 'Navigate', run: (r) => r.push('/admin/settings') },
  { id: 'nav-trash', label: 'Trash', icon: Trash2, group: 'Navigate', run: (r) => r.push('/admin/trash') },
  { id: 'new-office', label: 'New Office', icon: Plus, group: 'Create', run: (r) => r.push('/admin/offices/new') },
  { id: 'new-airline', label: 'New Airline', icon: Plus, group: 'Create', run: (r) => r.push('/admin/airlines/new') },
  { id: 'new-post', label: 'New Blog Post', icon: Plus, group: 'Create', run: (r) => r.push('/admin/blog/new') },
]

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const openRef = useRef(false)

  // Single entry point for open/close so state resets happen in event handlers
  // (never in an effect). Radix's onOpenChange (Esc/overlay) routes here too.
  const change = (v: boolean) => {
    openRef.current = v
    setOpen(v)
    if (v) {
      setQuery('')
      setActive(0)
    }
  }

  // Global ⌘K / Ctrl+K to toggle; a custom event lets the header button open it too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        change(!openRef.current)
      }
    }
    const onOpen = () => change(true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? STATIC.filter((i) => (i.label + ' ' + (i.keywords ?? '')).toLowerCase().includes(q))
      : STATIC
    // A free-text query also offers a deep-link into the offices search.
    const dynamic: Item[] = q
      ? [{
          id: 'search-offices',
          label: `Search offices for “${query.trim()}”`,
          icon: FileText,
          group: 'Search',
          run: (r) => r.push(`/admin/offices?q=${encodeURIComponent(query.trim())}`),
        }]
      : []
    return [...dynamic, ...base]
  }, [query])

  // Clamp during render instead of via an effect — keeps the highlight valid
  // when filtering shrinks the list.
  const safeActive = Math.min(active, Math.max(0, items.length - 1))

  const select = (item?: Item) => {
    const target = item ?? items[safeActive]
    if (!target) return
    change(false)
    target.run(router)
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      select()
    }
  }

  // Keep the active row scrolled into view (DOM side effect only — no setState).
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${safeActive}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [safeActive])

  let lastGroup = ''

  return (
    <DialogPrimitive.Root open={open} onOpenChange={change}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed top-[15vh] left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search and navigate the admin panel</DialogPrimitive.Description>

          <div className="flex items-center gap-2 border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onInputKey}
              placeholder="Search or jump to…"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
              ESC
            </kbd>
          </div>

          <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
            {items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results.</p>
            )}
            {items.map((item, idx) => {
              const showGroup = item.group !== lastGroup
              lastGroup = item.group
              return (
                <div key={item.id}>
                  {showGroup && (
                    <p className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {item.group}
                    </p>
                  )}
                  <button
                    type="button"
                    data-idx={idx}
                    onMouseMove={() => setActive(idx)}
                    onClick={() => select(item)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm',
                      idx === safeActive ? 'bg-accent text-accent-foreground' : 'text-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                    {idx === safeActive && <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
              )
            })}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
