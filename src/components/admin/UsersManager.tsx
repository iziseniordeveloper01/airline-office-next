'use client'

import { useEffect, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowUpDown,
  Ban,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  User as UserIcon,
  UserPlus,
} from 'lucide-react'
import { createUser, updateUserRole, banUser, unbanUser } from '@/app/admin/users/actions'
import { type Role } from '@/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type UserView = 'all' | 'admins' | 'editors' | 'banned'

export interface RowUser {
  id: string
  name: string
  email: string
  role: Role
  banned: boolean
  createdAt: string
}

interface Props {
  users: RowUser[]
  total: number
  page: number
  pageSize: number
  counts: { all: number; admins: number; editors: number; banned: number }
  query: { view: UserView; q: string; sort: string; sortDir: string }
  viewerId: string
  viewerRole: Role
}

const VIEWS: { id: UserView; label: string; countKey: keyof Props['counts'] }[] = [
  { id: 'all', label: 'All Users', countKey: 'all' },
  { id: 'admins', label: 'Administrators', countKey: 'admins' },
  { id: 'editors', label: 'Editors', countKey: 'editors' },
  { id: 'banned', label: 'Banned', countKey: 'banned' },
]

const roleBadge = (role: Role) => {
  const map: Record<Role, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
    super_admin: { label: 'Super Admin', className: 'bg-primary/10 text-primary', icon: ShieldCheck },
    admin: { label: 'Admin', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: Shield },
    editor: { label: 'Editor', className: 'bg-muted text-muted-foreground', icon: UserIcon },
  }
  const r = map[role]
  return (
    <Badge variant="secondary" className={`gap-1 ${r.className}`}>
      <r.icon className="h-3 w-3" />
      {r.label}
    </Badge>
  )
}

export default function UsersManager({ users, total, page, pageSize, counts, query, viewerId, viewerRole }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(query.q)
  const [pending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const isSuperAdmin = viewerRole === 'super_admin'

  const updateParams = (partial: Record<string, string>) => {
    const params = new URLSearchParams({
      view: query.view,
      q: query.q,
      sort: query.sort,
      sortDir: query.sortDir,
      page: String(page),
      ...partial,
    })
    // Drop empty params, plus the default view, to keep URLs clean.
    for (const [k, v] of [...params.entries()]) {
      if (!v || (k === 'view' && v === 'all')) params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    if (search === query.q) return
    const t = setTimeout(() => updateParams({ q: search, page: '1' }), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const toggleSort = (col: string) => {
    const sortDir = query.sort === col && query.sortDir === 'asc' ? 'desc' : 'asc'
    updateParams({ sort: col, sortDir })
  }

  const run = (fn: () => Promise<unknown>, ok: string, fail: string) =>
    startTransition(async () => {
      try {
        await fn()
        toast.success(ok)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : fail)
      }
    })

  const onCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    startTransition(async () => {
      try {
        await createUser(fd)
        toast.success('User created')
        setCreateOpen(false)
        form.reset()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create user')
      }
    })
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  // Plain render helper (not a component) so it isn't re-created each render.
  const sortHead = (col: string, label: string) => (
    <button type="button" onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-foreground">
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Saved views */}
      <div className="flex flex-wrap items-center gap-1 border-b">
        {VIEWS.map((v) => {
          const active = query.view === v.id
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => updateParams({ view: v.id, page: '1' })}
              className={cn(
                '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
              <span className={cn('rounded-full px-1.5 py-0.5 text-[11px]', active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {counts[v.countKey]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, or email (with @)…"
            className="pl-9"
          />
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4" /> Add user
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create user</DialogTitle>
              <DialogDescription>They can sign in immediately with these credentials.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Jane Doe" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="jane@yourdomain.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="editor">
                  <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={pending}>{pending ? 'Creating…' : 'Create user'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{sortHead('name', 'User')}</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>{sortHead('createdAt', 'Created')}</TableHead>
              <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
              </TableRow>
            )}
            {users.map((u) => {
              const isSelf = u.id === viewerId
              const canManage = !isSelf && u.role !== 'super_admin'
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {(u.name || u.email).slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {u.name} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(u.role)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={u.banned ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600 dark:text-green-400'}>
                      {u.banned ? 'Banned' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.createdAt}</TableCell>
                  <TableCell>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Change role</DropdownMenuLabel>
                          <DropdownMenuItem
                            className="gap-2"
                            disabled={u.role === 'editor'}
                            onClick={() => run(() => updateUserRole(u.id, 'editor'), 'Role updated to Editor', 'Failed to update role')}
                          >
                            <UserIcon className="h-4 w-4" /> Editor
                          </DropdownMenuItem>
                          {isSuperAdmin && (
                            <DropdownMenuItem
                              className="gap-2"
                              disabled={u.role === 'admin'}
                              onClick={() => run(() => updateUserRole(u.id, 'admin'), 'Role updated to Admin', 'Failed to update role')}
                            >
                              <Shield className="h-4 w-4" /> Admin
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {u.banned ? (
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => run(() => unbanUser(u.id), 'User unbanned', 'Failed to unban user')}
                            >
                              <RotateCcw className="h-4 w-4" /> Unban user
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              variant="destructive"
                              className="gap-2"
                              onClick={() => run(() => banUser(u.id), 'User banned', 'Failed to ban user')}
                            >
                              <Ban className="h-4 w-4" /> Ban user
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {total} user{total === 1 ? '' : 's'} · Page {page} of {pageCount}
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
    </div>
  )
}
