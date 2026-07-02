import { requireRole } from '@/lib/auth/requireRole'
import { getSettings } from '@/lib/data/getSettings'
import SettingsForm from '@/components/admin/SettingsForm'

export const metadata = { title: 'Settings — Admin' }

export default async function AdminSettingsPage() {
  await requireRole('admin')
  const settings = await getSettings()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Site Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Global content used across the public site. Changes take effect immediately.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  )
}
