import { z } from 'zod'

// Permissive by design: settings should almost never fail to save. Every field
// is an optional trimmed string; empty is allowed (clears the value). Only the
// known keys are accepted — anything else in the form is ignored.
const optionalStr = (max = 500) =>
  z.string().trim().max(max).optional().default('')

export const settingsSchema = z.object({
  siteTitle: optionalStr(150),
  tagline: optionalStr(255),
  contactPhone: optionalStr(50),
  contactEmail: z.union([z.literal(''), z.string().trim().email()]).optional().default(''),
  footerDisclaimer: optionalStr(500),
  statAirlines: optionalStr(20),
  statOffices: optionalStr(20),
  statCountries: optionalStr(20),
  facebook: optionalStr(255),
  twitter: optionalStr(255),
  instagram: optionalStr(255),
  youtube: optionalStr(255),
  linkedin: optionalStr(255),
  metaDescription: optionalStr(500),
  googleSiteVerification: optionalStr(255),
  bingSiteVerification: optionalStr(255),
})

export type SettingsInput = z.infer<typeof settingsSchema>
