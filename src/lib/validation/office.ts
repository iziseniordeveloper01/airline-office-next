import { z } from 'zod'
import { statusFieldsSchema, isScheduledDateValid } from './content'

// RHF/client-side schema for the fields that actually have meaningful
// validation (the rest keep native HTML required/type attributes, same as
// before). Reuses statusFieldsSchema + isScheduledDateValid from content.ts —
// the "scheduled must be future" rule has exactly one implementation, shared
// with the server-side statusTransitionSchema used in saveOffice.
export const officeFormSchema = statusFieldsSchema
  .extend({
    airlineId: z.number().int().positive({ message: 'Select an airline' }),
    fullTitle: z.string().min(1, { message: 'Title is required' }),
    slug: z.string().min(1, { message: 'Slug is required' }),
    city: z.string().min(1, { message: 'City is required' }),
    country: z.string().min(1, { message: 'Country is required' }),
    content: z.string().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  })
  .refine(isScheduledDateValid, { message: 'Scheduled date must be in the future', path: ['scheduledAt'] })

export type OfficeFormValues = z.infer<typeof officeFormSchema>
