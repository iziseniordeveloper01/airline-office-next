import { headers } from 'next/headers'
import { auth } from '@/auth'
import { type Role } from '@/types'

export const HIERARCHY: Record<Role, number> = {
  editor: 1,
  admin: 2,
  super_admin: 3,
}

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user ?? null
}

export async function requireRole(minimum: Role) {
  const session = await auth.api.getSession({ headers: await headers() })
  const role = session?.user?.role as Role | undefined
  if (!session || !role) throw new Error('Unauthorized')
  if (HIERARCHY[role] < HIERARCHY[minimum]) throw new Error('Forbidden')
  return session
}
