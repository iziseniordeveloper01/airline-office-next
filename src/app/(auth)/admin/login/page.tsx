import { headers } from 'next/headers'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/admin/LoginForm'

// Lives in the (auth) group, outside src/app/admin/, so the admin layout's
// session guard never wraps it — otherwise guard-redirects-to-login and
// login-redirects-to-admin would chase each other. URL stays /admin/login/.
export const metadata = {
  title: 'Login — Airline Office Directory',
  robots: 'noindex, nofollow',
}

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect('/admin')

  // LoginForm is a max-w-md block styled for a DARK surface (white/indigo text).
  // This wrapper provides that surface and centers it — without it the card
  // hangs off the left edge on a bare white page. (The old admin/login/layout
  // that used to do this was removed when the route moved into the (auth) group.)
  return (
    <div className="flex min-h-dvh items-center justify-center bg-linear-to-br from-slate-900 via-slate-900 to-indigo-950 p-6">
      <LoginForm />
    </div>
  )
}
