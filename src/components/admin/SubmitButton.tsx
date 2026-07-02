'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-5 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
        pending ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
      }`}
    >
      {pending ? 'Saving…' : children}
    </button>
  )
}
