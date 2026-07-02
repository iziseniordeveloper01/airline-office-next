'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProfileForms({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [savingName, startName] = useTransition()
  const [pwPending, startPw] = useTransition()

  const saveName = () => {
    if (!name.trim()) return toast.error('Name cannot be empty')
    startName(async () => {
      const { error } = await authClient.updateUser({ name: name.trim() })
      if (error) {
        toast.error(error.message || 'Failed to update name')
        return
      }
      toast.success('Profile updated')
      router.refresh()
    })
  }

  const changePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const currentPassword = String(data.get('currentPassword') || '')
    const newPassword = String(data.get('newPassword') || '')
    const confirm = String(data.get('confirm') || '')
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters')
    if (newPassword !== confirm) return toast.error('Passwords do not match')
    startPw(async () => {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (error) {
        toast.error(error.message || 'Failed to change password')
        return
      }
      toast.success('Password changed')
      form.reset()
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Display name</CardTitle>
          <CardDescription>Shown in the header and activity across the panel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <Button onClick={saveName} disabled={savingName || name.trim() === initialName}>
            {savingName ? 'Saving…' : 'Save name'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>You&apos;ll stay signed in here; other sessions are signed out.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
            </div>
            <Button type="submit" disabled={pwPending}>
              {pwPending ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
