'use client'

import Link from 'next/link'
import { Fragment } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronsUpDown, LogOut, Search, Settings, User } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ModeToggle from '@/components/admin/ModeToggle'

interface Props {
  user?: { name?: string | null; email?: string | null; role?: string | null } | null
}

// Humanized labels for known path segments; unknown segments (slugs) render
// as-is (de-slugged) so deep content pages still get a sensible trail.
const LABELS: Record<string, string> = {
  admin: 'Dashboard',
  offices: 'Offices',
  airlines: 'Airlines',
  blog: 'Blog',
  users: 'Users',
  settings: 'Settings',
  trash: 'Trash',
  new: 'New',
  profile: 'Profile',
  media: 'Media',
  activity: 'Activity',
}

const humanize = (s: string) =>
  LABELS[s] ?? s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

function useCrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean) // e.g. ['admin','offices','x']
  return segments.map((seg, i) => ({
    label: humanize(seg),
    href: '/' + segments.slice(0, i + 1).join('/'),
    last: i === segments.length - 1,
  }))
}

export default function AdminHeader({ user }: Props) {
  const router = useRouter()
  const crumbs = useCrumbs()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const initials = (user?.name || user?.email || 'A').slice(0, 1).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-backdrop-filter:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((c) => (
          <Fragment key={c.href}>
            {c.last ? (
              <span className="truncate font-medium">{c.label}</span>
            ) : (
              <>
                <Link href={c.href} className="truncate text-muted-foreground hover:text-foreground">
                  {c.label}
                </Link>
                <span className="text-muted-foreground/40">/</span>
              </>
            )}
          </Fragment>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Search trigger — opens the ⌘K command palette */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          className="hidden items-center gap-2 rounded-lg border bg-muted/40 py-1.5 pr-1.5 pl-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="pr-6">Search…</span>
          <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
        </button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <ModeToggle />

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 text-left transition-colors hover:bg-muted',
              )}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden leading-tight sm:grid">
                <span className="max-w-32 truncate text-xs font-medium">{user?.name || 'Admin'}</span>
                <span className="max-w-32 truncate text-[11px] text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ') || 'user'}
                </span>
              </div>
              <ChevronsUpDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="truncate text-sm font-medium text-foreground normal-case">{user?.name || 'Admin'}</span>
              <span className="truncate text-xs font-normal">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/admin/profile')} className="gap-2">
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin/settings')} className="gap-2">
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="gap-2"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: { onSuccess: () => router.push('/admin/login') },
                })
              }
            >
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
