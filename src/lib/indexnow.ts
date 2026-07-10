import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { settings as settingsTable } from '@/lib/schema'
import { getSettings } from '@/lib/data/getSettings'
import { bustTags, CACHE_TAGS } from '@/lib/cache'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL

// A stable token proving domain ownership to IndexNow-enabled search engines
// (Bing, Yandex, Seznam, Naver…). Generated lazily on first ping and stored in
// the same settings table saveSettings() writes to — but deliberately absent
// from settingsSchema, so saving the admin Settings form can never blank it.
async function getOrCreateIndexNowKey(): Promise<string> {
  const settings = await getSettings()
  if (settings.indexNowKey) return settings.indexNowKey

  const key = randomBytes(16).toString('hex')
  await db.insert(settingsTable)
    .values({ key: 'indexNowKey', value: key })
    .onDuplicateKeyUpdate({ set: { value: key } })
  bustTags(CACHE_TAGS.settings)
  return key
}

// Fire-and-forget: tells IndexNow a URL was published/updated so it can be
// crawled within minutes instead of waiting for the next scheduled crawl.
// Never throws — callers await it right after a save, and a failed ping must
// never surface as a failed save.
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!urls.length || !SITE_URL) return
  try {
    const settings = await getSettings()
    if (settings.indexNowEnabled !== 'true') return

    const key = await getOrCreateIndexNowKey()
    const host = new URL(SITE_URL).host

    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${SITE_URL}/api/indexnow/${key}`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.warn('[indexnow] ping failed:', (err as Error).message)
  }
}
