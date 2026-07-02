import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { getCurrentUser } from '@/lib/auth/requireRole'
import { getRecentActivityByUser } from '@/lib/data/getActivity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ProfileForms from '@/components/admin/ProfileForms'

export const metadata = { title: 'Profile — Admin' }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const recent = await getRecentActivityByUser(user.id, 8)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details and password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <Badge variant="secondary" className="mt-0.5 capitalize">
              {(user.role as string | undefined)?.replace('_', ' ') || 'user'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="secondary" className="mt-0.5">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <ProfileForms initialName={user.name ?? ''} />

      <Card>
        <CardHeader>
          <CardTitle>Your recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {recent.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">No activity recorded yet.</p>
          )}
          {recent.map((row) => {
            const label = (
              <span className="text-sm">
                <span className="capitalize text-muted-foreground">{row.action}</span>{' '}
                <span className="text-muted-foreground">{row.entityType}</span>{' '}
                {row.entityTitle && <span className="font-medium">{row.entityTitle}</span>}
              </span>
            )
            return (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5">
                {row.href ? (
                  <Link href={row.href} className="min-w-0 truncate hover:underline">{label}</Link>
                ) : (
                  <span className="min-w-0 truncate">{label}</span>
                )}
                <time className="shrink-0 text-xs text-muted-foreground" suppressHydrationWarning>
                  {row.createdAt ? formatDistanceToNow(new Date(row.createdAt), { addSuffix: true }) : ''}
                </time>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
