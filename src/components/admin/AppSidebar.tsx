'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Plane, Building2, Newspaper, FolderOpen, Image, Users, Activity, Settings, Trash2, LogOut, PlaneTakeoff } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Props {
  user?: { name?: string | null; email?: string | null; role?: string | null } | null
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/offices', label: 'Offices', icon: Building2 },
  { href: '/admin/airlines', label: 'Airlines', icon: Plane },
  { href: '/admin/blog', label: 'Blog', icon: Newspaper },
  { href: '/admin/blog/categories', label: 'Categories', icon: FolderOpen },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/users', label: 'Users', icon: Users, adminOnly: true },
  { href: '/admin/activity', label: 'Activity', icon: Activity, adminOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: Settings, adminOnly: true },
  { href: '/admin/trash', label: 'Trash', icon: Trash2 },
]

export default function AppSidebar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <PlaneTakeoff className="h-4 w-4" />
          </span>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">Airline Admin</span>
            <span className="truncate text-xs text-sidebar-foreground/60">Content Manager</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={isActive(item.href, item.exact)} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 px-2 py-1.5 group-data-[collapsible=icon]:hidden">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
              {user?.name?.[0] || user?.email?.[0] || 'A'}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-xs leading-tight">
            <span className="truncate font-medium text-sidebar-foreground">{user?.name || 'Admin'}</span>
            <span className="truncate text-sidebar-foreground/60">{user?.email}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: { onSuccess: () => router.push('/admin/login') },
                })
              }
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
