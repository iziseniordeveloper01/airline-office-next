'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { auth } from '@/auth'
import { requireRole } from '@/lib/auth/requireRole'
import { logActivity } from '@/lib/activity'
import { type Role } from '@/types'

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(128),
  role: z.enum(['editor', 'admin', 'super_admin']),
})

export async function createUser(formData: FormData) {
  const session = await requireRole('admin')
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)
  const { role: requestedRole, ...rest } = parsed.data

  // admin can only create editors. Only super_admin can create admins.
  const currentRole = session.user.role as Role
  if (requestedRole === 'super_admin') throw new Error('Cannot create super_admin')
  if (requestedRole === 'admin' && currentRole !== 'super_admin') throw new Error('Only super_admin can create admin')

  await auth.api.createUser({
    headers: await headers(),
    body: { ...rest, role: requestedRole },
  })
  revalidatePath('/admin/users')
  await logActivity(session.user, { action: 'created', entityType: 'user', entityTitle: `${rest.name} (${requestedRole})`, href: '/admin/users' })
}

const roleSchema = z.enum(['editor', 'admin', 'super_admin'])

export async function updateUserRole(userId: string, newRole: Role) {
  const session = await requireRole('admin')
  const role = roleSchema.parse(newRole)
  if (role === 'super_admin') throw new Error('Cannot assign super_admin role')
  if (role === 'admin' && session.user.role !== 'super_admin') throw new Error('Only super_admin can assign admin')

  await auth.api.setRole({
    headers: await headers(),
    body: { userId: z.string().min(1).parse(userId), role },
  })
  revalidatePath('/admin/users')
  await logActivity(session.user, { action: 'updated', entityType: 'user', entityId: userId, entityTitle: `role → ${role}`, href: '/admin/users' })
}

export async function banUser(userId: string) {
  const session = await requireRole('admin')
  await auth.api.banUser({
    headers: await headers(),
    body: { userId: z.string().min(1).parse(userId) },
  })
  revalidatePath('/admin/users')
  await logActivity(session.user, { action: 'updated', entityType: 'user', entityId: userId, entityTitle: 'banned', href: '/admin/users' })
}

export async function unbanUser(userId: string) {
  const session = await requireRole('admin')
  await auth.api.unbanUser({
    headers: await headers(),
    body: { userId: z.string().min(1).parse(userId) },
  })
  revalidatePath('/admin/users')
  await logActivity(session.user, { action: 'updated', entityType: 'user', entityId: userId, entityTitle: 'unbanned', href: '/admin/users' })
}
