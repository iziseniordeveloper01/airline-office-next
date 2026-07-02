import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Build a `tel:` href from a display phone string (strips spaces, dashes, parens
// but keeps a leading +). Returns '' for an empty input so callers can guard.
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : ''
}
