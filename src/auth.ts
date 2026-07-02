import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins/admin'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { ac, roles } from '@/lib/auth/permissions'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'mysql',
    schema,
    usePlural: true,
  }),

  emailAndPassword: {
    enabled: true,
  },

  session: {
    expiresIn: 60 * 60 * 8, // 8 hours, matches the previous NextAuth session lifetime
  },

  plugins: [
    admin({
      ac,
      roles,
      defaultRole: 'editor',
      adminRoles: ['admin', 'super_admin'],
      bannedUserMessage: 'This account has been deactivated. Contact a super admin to restore access.',
    }),
    // Must be the last plugin — lets server actions set cookies without manual Set-Cookie handling.
    nextCookies(),
  ],
})
