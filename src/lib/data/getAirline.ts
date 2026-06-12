import fs from 'fs'
import path from 'path'
import type { Airline, AirlineIndex } from '@/types'

const AIRLINES_DIR = path.join(process.cwd(), 'data/airlines')

export async function getAllAirlines(): Promise<AirlineIndex[]> {
  try {
    const raw = fs.readFileSync(path.join(AIRLINES_DIR, '_index.json'), 'utf-8')
    return JSON.parse(raw) as AirlineIndex[]
  } catch {
    return []
  }
}

export async function getAirline(slug: string): Promise<Airline | null> {
  try {
    const raw = fs.readFileSync(path.join(AIRLINES_DIR, `${slug}.json`), 'utf-8')
    return JSON.parse(raw) as Airline
  } catch {
    return null
  }
}