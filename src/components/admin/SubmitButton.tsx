'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-5 py-2 text-sm font-medium rounded-lg text-primary-foreground transition-colors ${
        pending ? 'bg-primary/60 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'
      }`}
    >
      {pending ? 'Saving…' : children}
    </button>
  )
}
