import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements } from 'better-auth/plugins/admin/access'

// Roles: super_admin > admin > editor
// super_admin  → full access including creating/deleting admin users
// admin        → create editors, manage all content, cannot touch super_admin accounts
// editor       → create & edit offices/airlines/blog, cannot delete, cannot manage users
const statement = {
  ...defaultStatements,
} as const

export const ac = createAccessControl(statement)

export const editor = ac.newRole({
  user: [],
  session: [],
})

export const admin = ac.newRole({
  user: ['create', 'list', 'set-role', 'ban', 'get', 'update', 'set-password'],
  session: ['list', 'revoke'],
})

export const superAdmin = ac.newRole({
  user: ['create', 'list', 'set-role', 'ban', 'impersonate', 'impersonate-admins', 'delete', 'set-password', 'set-email', 'get', 'update'],
  session: ['list', 'revoke', 'delete'],
})

export const roles = { editor, admin, super_admin: superAdmin }
