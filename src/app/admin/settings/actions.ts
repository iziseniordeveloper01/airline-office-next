'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { settings as settingsTable } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { settingsSchema } from '@/lib/validation/settings'
import { bustTags, CACHE_TAGS } from '@/lib/cache'
import { logActivity } from '@/lib/activity'

// Returns void; the client form toasts on success and surfaces thrown
// validation errors. (Previously redirected with ?saved=1 — replaced by toast.)
export async function saveSettings(formData: FormData) {
  const session = await requireRole('admin')

  const parsed = settingsSchema.parse(Object.fromEntries(formData))
  const entries = Object.entries(parsed) as [string, string][]

  await Promise.all(
    entries.map(([key, value]) =>
      db
        .insert(settingsTable)
        .values({ key, value, updatedBy: session.user.id })
        .onDuplicateKeyUpdate({ set: { value, updatedBy: session.user.id } }),
    ),
  )

  // Settings feed the site-wide chrome and root metadata, so bust the settings
  // data cache and re-render everything under the root layout.
  bustTags(CACHE_TAGS.settings)
  revalidatePath('/', 'layout')

  await logActivity(session.user, { action: 'updated', entityType: 'settings', entityTitle: 'Site settings', href: '/admin/settings' })
}
