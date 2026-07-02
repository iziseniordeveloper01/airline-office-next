import { config } from 'dotenv'
config({ path: '.env.local' })

async function seed() {
  // Dynamic import — auth.ts reads process.env.DATABASE_URL at module-load time,
  // so it must only be imported after dotenv has populated the environment.
  const { auth } = await import('../src/auth')
  const { db } = await import('../src/lib/db')
  const { users } = await import('../src/lib/schema')
  const { eq } = await import('drizzle-orm')

  const email = (process.env.ADMIN_EMAIL || 'admin@yourdomain.com').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234'

  // setUserPassword/setRole are admin-plugin endpoints gated to an authenticated
  // admin session — there's no session yet at bootstrap time, so re-seeding just
  // drops the previous bootstrap user (cascades to its account/session rows) and
  // signs up fresh through the public endpoint instead.
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    await db.delete(users).where(eq(users.id, existing.id))
  }

  const result = await auth.api.signUpEmail({ body: { name: 'Super Admin', email, password } })
  await db.update(users).set({ role: 'super_admin' }).where(eq(users.id, result.user.id))

  console.log(`Seed done — super_admin created (${email})`)
  process.exit(0)
}

seed()
