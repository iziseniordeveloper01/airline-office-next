import { cache } from 'react'
import { db } from '@/lib/db'
import { settings as settingsTable } from '@/lib/schema'
import { cachedRead, CACHE_TAGS } from '@/lib/cache'

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
  robotsDisallowAll: string
  robotsBlockQueryStrings: string
  robotsExtraDisallow: string
  indexNowEnabled: string
  // System-generated, not part of settingsSchema/SettingsForm — see
  // getOrCreateIndexNowKey() in lib/indexnow.ts. Present here only so
  // getSettings() (the one cached DB read every setting goes through) can
  // surface it without a second query.
  indexNowKey: string
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
  robotsDisallowAll: '',
  robotsBlockQueryStrings: '',
  robotsExtraDisallow: '',
  indexNowEnabled: '',
  indexNowKey: '',
}

export const SETTINGS_FIELDS = Object.keys(SETTINGS_DEFAULTS) as (keyof SiteSettings)[]

// The DB read + merge. Throws on DB failure (never returns defaults) so the
// persistent cache below can't store the fallback during a build/outage.
async function readSettingsFromDb(): Promise<SiteSettings> {
  const rows = await db.select().from(settingsTable)
  const stored = new Map(rows.map((r) => [r.key, r.value]))
  const result = { ...SETTINGS_DEFAULTS }
  for (const field of SETTINGS_FIELDS) {
    // A stored row wins even when empty — once saved, the admin fully controls
    // the value (including clearing it). Defaults apply only before first save.
    if (stored.has(field)) result[field] = stored.get(field) ?? ''
  }
  return result
}

// Cross-request cache; read on every page via the layouts and metadata, so this
// is one of the hottest reads. Busted by the settings tag when an admin saves.
const cachedSettings = cachedRead(readSettingsFromDb, ['settings:all'], [CACHE_TAGS.settings])

async function readSettings(): Promise<SiteSettings> {
  try {
    return await cachedSettings()
  } catch (err) {
    // The DB is unreachable during `next build` on Railway — the private
    // `*.railway.internal` host only resolves at runtime, so any page whose
    // metadata reads settings (e.g. the prerendered /_not-found) would crash the
    // build. Fall back to defaults instead (kept outside the cache so the
    // fallback is never persisted); real values fill in on the first request.
    console.warn('[getSettings] DB read failed, using defaults:', (err as Error).message)
    return { ...SETTINGS_DEFAULTS }
  }
}

// React cache() dedupes the read within a single render (root layout, site
// layout, and hero components all call it).
export const getSettings = cache(readSettings)
