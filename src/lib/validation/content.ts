import { z } from 'zod'

export const statusEnum = z.enum(['draft', 'published', 'scheduled'])
export type Status = z.infer<typeof statusEnum>

// scheduledAt arrives as a UTC ISO string (converted client-side — see src/lib/datetime.ts).
export const statusFieldsSchema = z.object({
  status: statusEnum,
  scheduledAt: z.string().datetime().nullable().optional(),
})

// The actual rule, as a plain predicate rather than baked into one schema's
// .refine() — both statusTransitionSchema (server, below) and each entity's
// RHF form schema (e.g. src/lib/validation/office.ts) call this exact function
// so "scheduled must be in the future" can never drift between client and server.
export function isScheduledDateValid(data: { status: Status; scheduledAt?: string | null }): boolean {
  if (data.status !== 'scheduled') return true
  if (!data.scheduledAt) return false
  return new Date(data.scheduledAt).getTime() > Date.now()
}

export const statusTransitionSchema = statusFieldsSchema.refine(isScheduledDateValid, {
  message: 'Scheduled date must be in the future',
  path: ['scheduledAt'],
})

export interface StatusFields {
  status: Status
  scheduledAt: Date | null
  publishedAt: Date | null
}

// Derives the columns to write for a status transition. `existingPublishedAt` lets a
// republish keep the original publishedAt instead of bumping it on every edit.
export function resolveStatusFields(
  raw: { status: string; scheduledAt: string | null | undefined },
  existingPublishedAt: Date | null
): StatusFields {
  const parsed = statusTransitionSchema.parse({
    status: raw.status,
    scheduledAt: raw.scheduledAt || null,
  })

  if (parsed.status === 'published') {
    return { status: 'published', scheduledAt: null, publishedAt: existingPublishedAt ?? new Date() }
  }
  if (parsed.status === 'scheduled') {
    return { status: 'scheduled', scheduledAt: new Date(parsed.scheduledAt!), publishedAt: null }
  }
  return { status: 'draft', scheduledAt: null, publishedAt: null }
}
