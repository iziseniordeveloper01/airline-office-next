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

// Serialize JSON-LD for an inline <script> block. JSON.stringify alone does NOT
// escape "</script>", so editor-entered text (titles, FAQ answers) could break
// out of the script element and inject markup into the public page. The
// unicode-escaped form stays valid JSON and is inert inside a script element.
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
