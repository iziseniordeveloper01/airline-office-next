import { z } from 'zod'

// ─── URL sanitization ────────────────────────────────────────────────────────
// These fields are stored raw and later rendered into href / iframe src on
// PUBLIC pages. Without a scheme check, an editor could store "javascript:..."
// (executes on click) or "data:text/html,..." — an editor→visitor XSS path.
// safeUrl() returns the value only when it's a well-formed http(s) URL, else
// null, so the column simply holds nothing rather than a hostile URI.

const HTTP_SCHEMES = new Set(['http:', 'https:'])

export function safeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    return HTTP_SCHEMES.has(u.protocol) ? u.href : null
  } catch {
    return null
  }
}

// The office map iframe embeds this URL directly. Restrict it to Google Maps
// embed hosts — an arbitrary https iframe would let an editor frame any page
// into a public office listing.
const MAP_EMBED_HOSTS = new Set(['www.google.com', 'maps.google.com', 'www.google.co.in'])

export function safeMapEmbedUrl(input: unknown): string | null {
  const url = safeUrl(input)
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:') return null
    if (!MAP_EMBED_HOSTS.has(u.hostname)) return null
    // Google's embeddable maps live under /maps/embed; a plain /maps link is a
    // normal page, not an embed, and would be X-Frame-Options-blocked anyway.
    if (!u.pathname.startsWith('/maps/embed')) return null
    return u.href
  } catch {
    return null
  }
}

// ─── FAQ payload ─────────────────────────────────────────────────────────────
// FAQs arrive as a JSON string in FormData. Parsing without a shape check means
// a tampered payload could insert malformed rows or throw mid-save. This bounds
// count and field lengths and drops empty entries.
export const faqArraySchema = z
  .array(
    z.object({
      question: z.string().trim().min(1).max(500),
      answer: z.string().trim().min(1).max(5000),
    })
  )
  .max(50)

export function parseFaqs(raw: unknown): { question: string; answer: string }[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  const result = faqArraySchema.safeParse(parsed)
  return result.success ? result.data : []
}
