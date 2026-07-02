import { headers } from 'next/headers'
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
  const session = await auth.api.getSession({ headers: await headers() })

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
