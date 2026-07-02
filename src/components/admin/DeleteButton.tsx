'use client'

import { useState } from 'react'

interface Props {
  action: () => Promise<void>
  confirmMessage: string
  className?: string
  children: React.ReactNode
}

export default function DeleteButton({ action, confirmMessage, className, children }: Props) {
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!confirm(confirmMessage)) return
    setPending(true)
    try {
      await action()
    } finally {
      setPending(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={pending} className={className}>
      {pending ? 'Deleting…' : children}
    </button>
  )
}
