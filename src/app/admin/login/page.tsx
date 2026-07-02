import { headers } from 'next/headers'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/admin/LoginForm'

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect('/admin')

  return <LoginForm />
}