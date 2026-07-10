import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import AppSidebar from '@/components/admin/AppSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import CommandPalette from '@/components/admin/CommandPalette'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Admin Panel — Airline Office Directory',
  robots: 'noindex, nofollow', // Search engines se hide karo
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // The real auth gate for every /admin page. proxy.ts only does an optimistic
  // cookie-presence redirect (forgeable, CVE-2025-29927); this validates the
  // session server-side so no admin page ever renders unauthenticated. The
  // login page lives in src/app/(auth)/admin/login — outside this layout —
  // so this redirect can never loop. Pages needing more than "any staff role"
  // (users, settings, activity) keep their own requireRole('admin') on top.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/admin/login/')

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={0}>
        <SidebarProvider>
          <AppSidebar user={session?.user} />
          <SidebarInset>
            <AdminHeader user={session?.user} />
            <div className="flex-1 bg-muted/30 p-4 sm:p-6">{children}</div>
          </SidebarInset>
          <CommandPalette />
        </SidebarProvider>
        <Toaster richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  )
}
