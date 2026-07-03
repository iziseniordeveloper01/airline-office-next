import { cache } from 'react'
import { db } from '@/lib/db'
import { settings as settingsTable } from '@/lib/schema'

// Site-wide, admin-editable settings. Field names double as the DB keys in the
// `settings` key/value table. Defaults mirror the values that used to be
// hardcoded in the public components, so behavior is unchanged until an admin
// edits them.
export interface SiteSettings {
  siteTitle: string
  tagline: string
  contactPhone: string
  contactEmail: string
  footerDisclaimer: string
  statAirlines: string
  statOffices: string
  statCountries: string
  facebook: string
  twitter: string
  instagram: string
  youtube: string
  linkedin: string
  metaDescription: string
  googleSiteVerification: string
  bingSiteVerification: string
}

export const SETTINGS_DEFAULTS: SiteSettings = {
  siteTitle: 'Airline Office Directory',
  tagline: 'Find Airline Offices, Headquarters & Contact Details Worldwide',
  contactPhone: '+1-877-294-7147',
  contactEmail: 'support@airlineofficedirectory.com',
  footerDisclaimer: 'Disclaimer: This is an independent directory and is not affiliated with any airline.',
  statAirlines: '500+',
  statOffices: '2,000+',
  statCountries: '120+',
  facebook: '',
  twitter: '',
  instagram: '',
  youtube: '',
  linkedin: '',
  metaDescription:
    'Search verified airline office addresses, phone numbers, working hours and headquarters information for 500+ airlines across 120+ countries.',
  googleSiteVerification: '',
  bingSiteVerification: '',
}

export const SETTINGS_FIELDS = Object.keys(SETTINGS_DEFAULTS) as (keyof SiteSettings)[]

async function readSettings(): Promise<SiteSettings> {
  let rows: { key: string; value: string | null }[]
  try {
    rows = await db.select().from(settingsTable)
  } catch (err) {
    // The DB is unreachable during `next build` on Railway — the private
    // `*.railway.internal` host only resolves at runtime, so any page whose
    // metadata reads settings (e.g. the prerendered /_not-found) would crash the
    // build. Fall back to defaults instead: the values are baked into static/ISR
    // pages and refreshed on the first request once the DB is reachable. This
    // also keeps the site serving (with defaults) through a transient DB outage.
    console.warn('[getSettings] DB read failed, using defaults:', (err as Error).message)
    return { ...SETTINGS_DEFAULTS }
  }
  const stored = new Map(rows.map((r) => [r.key, r.value]))
  const result = { ...SETTINGS_DEFAULTS }
  for (const field of SETTINGS_FIELDS) {
    // A stored row wins even when empty — once saved, the admin fully controls
    // the value (including clearing it). Defaults apply only before first save.
    if (stored.has(field)) result[field] = stored.get(field) ?? ''
  }
  return result
}

// React cache() dedupes the read within a single render (root layout, site
// layout, and hero components all call it). The values are baked into each
// static/ISR page; the save action calls revalidatePath('/', 'layout') to
// refresh them site-wide.
export const getSettings = cache(readSettings)
