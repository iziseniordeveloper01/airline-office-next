export function sanitizeSlug(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
}

// Appends -2, -3… until `isTaken` returns false. The caller's `isTaken` query must
// NOT filter out soft-deleted rows — the DB unique index doesn't know about
// deletedAt, so a trashed row's slug is still occupied and must still count as taken.
export async function ensureUniqueSlug(
  base: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const cleaned = sanitizeSlug(base) || 'untitled'
  let candidate = cleaned
  let n = 2
  while (await isTaken(candidate)) {
    candidate = `${cleaned}-${n}`
    n++
  }
  return candidate
}

export function readingTime(html: string): string {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 200))} min`
}
