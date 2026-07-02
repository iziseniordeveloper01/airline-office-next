'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button, type buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

interface Props {
  title: string
  description: string
  action: () => Promise<unknown>
  successMessage?: string
  errorMessage?: string
  confirmLabel?: string
  variant?: VariantProps<typeof buttonVariants>['variant']
  trigger: React.ReactNode
}

// Shared AlertDialog-backed confirm for every destructive/state-changing admin
// action (single-row Trash/Restore/Delete-permanently, and the bulk toolbar) —
// replaces window.confirm() site-wide; result is reported via a sonner toast.
export default function ConfirmButton({
  title,
  description,
  action,
  successMessage = 'Done',
  errorMessage = 'Something went wrong',
  confirmLabel = 'Confirm',
  variant = 'destructive',
  trigger,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
        setOpen(false)
      } catch {
        toast.error(errorMessage)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button variant={variant} disabled={pending} onClick={handleConfirm}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
