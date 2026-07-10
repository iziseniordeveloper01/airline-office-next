import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { redirects } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import RedirectsManager from '@/components/admin/RedirectsManager'

export const metadata = { title: 'Redirects — Admin' }

export default async function AdminRedirectsPage() {
  await requireRole('admin')

  const rows = await db.select().from(redirects).orderBy(desc(redirects.createdAt))
  const items = rows.map((r) => ({
    id: r.id,
    fromPath: r.fromPath,
    toPath: r.toPath,
    createdAt: r.createdAt?.toISOString() ?? '',
  }))

  return <RedirectsManager redirects={items} />
}
