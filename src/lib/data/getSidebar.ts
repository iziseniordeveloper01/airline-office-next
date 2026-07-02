import fs from 'fs'
import path from 'path'
import type { SidebarData } from '@/types'
import { getAllOfficePaths } from './getOffice'
import { getAllAirlines } from './getAirline'
import { getLatestPosts } from './getBlog'

const META_DIR = path.join(process.cwd(), 'data/meta')

// Sidebar ke liye saara data ek jagah se
export async function getSidebarData() {
  // sidebar.json se static data (editorial curation, not in the DB)
  let sidebarMeta: SidebarData = { popularPages: [], topAirlines: [] }
  try {
    const raw = fs.readFileSync(path.join(META_DIR, 'sidebar.json'), 'utf-8')
    sidebarMeta = JSON.parse(raw)
  } catch {}

  // Latest 6 blog posts
  const latestPosts = await getLatestPosts(6)

  // Latest 8 office pages (updatedAt se sort)
  const allPaths = await getAllOfficePaths()
  const latestPages = allPaths
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)

  // Top airlines (featured waale)
  const airlines = await getAllAirlines()
  const featuredAirlines = airlines.filter((a) => a.isFeatured).slice(0, 6)

  return {
    latestPosts,
    latestPages,
    popularPages: sidebarMeta.popularPages,
    topAirlines: featuredAirlines,
  }
}
