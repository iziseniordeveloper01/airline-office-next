// <input type="datetime-local"> values carry no timezone offset — they're parsed
// and formatted using the browser's local time, so all conversions here must run
// client-side. Stored values are always UTC ISO strings (see src/lib/db.ts timezone: 'Z').

// Stored UTC Date -> the input's local wall-clock string ("YYYY-MM-DDTHH:mm")
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// The input's raw local wall-clock string -> a UTC ISO string for submission.
// `new Date(rawString)` on a zone-less string is parsed as local time by spec,
// so this only produces a correct UTC instant when called in the browser.
export function fromDatetimeLocalValue(raw: string): string | null {
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// Public-site display format for stored UTC ISO strings ("May 14, 2026").
// Explicit locale + UTC zone so server render and client hydration produce the
// identical string regardless of the machine's locale/timezone (a bare
// toLocaleDateString() here would risk hydration mismatches and off-by-one-day
// dates for readers east/west of UTC).
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
