import fs from 'fs'
import path from 'path'
import type { Office } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data/offices')

export async function getOffice(
  airlineSlug: string,
  officeSlug: string
): Promise<Office | null> {
  try {
    const filePath = path.join(DATA_DIR, airlineSlug, `${officeSlug}.json`)
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as Office
  } catch {
    return null
  }
}

export async function getOfficesByAirline(airlineSlug: string): Promise<Office[]> {
  try {
    const dir = path.join(DATA_DIR, airlineSlug)
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
    return files
      .map((file) => {
        const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
        return JSON.parse(raw) as Office
      })
      .filter((o) => o.isPublished)
  } catch {
    return []
  }
}

export interface OfficePath {
  airlineSlug: string
  slug: string
  updatedAt: string
}

export async function getAllOfficePaths(): Promise<OfficePath[]> {
  const paths: OfficePath[] = []
  if (!fs.existsSync(DATA_DIR)) return paths

  const airlines = fs.readdirSync(DATA_DIR)
  for (const airline of airlines) {
    const airlineDir = path.join(DATA_DIR, airline)
    if (!fs.statSync(airlineDir).isDirectory()) continue
    const files = fs.readdirSync(airlineDir).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(airlineDir, file), 'utf-8')
        const office = JSON.parse(raw) as Office
        if (office.isPublished) {
          paths.push({ airlineSlug: airline, slug: office.slug, updatedAt: office.updatedAt })
        }
      } catch { /* skip */ }
    }
  }
  return paths
}