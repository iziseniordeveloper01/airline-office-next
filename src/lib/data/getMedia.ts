import { desc, eq, like, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { images, airlines, offices, blogPosts } from '@/lib/schema'

export interface MediaItem {
  id: string
  filename: string | null
  mimeType: string
  width: number | null
  height: number | null
  createdAt: string | null
}

export interface MediaPageParams {
  page?: number
  pageSize?: number
  q?: string
}

// Never selects the `data` blob — the grid only needs metadata; the bytes are
// streamed separately via /api/images/[id].
export async function getMediaPage(
  params: MediaPageParams
): Promise<{ rows: MediaItem[]; total: number }> {
  const page = Math.max(1, params.page ?? 1)
  const pageSize = Math.min(60, Math.max(1, params.pageSize ?? 24))

  const where = params.q ? like(images.filename, `%${params.q}%`) : undefined

  const [rows, [{ count }]] = await Promise.all([
    db.select({
      id: images.id,
      filename: images.filename,
      mimeType: images.mimeType,
      width: images.width,
      height: images.height,
      createdAt: images.createdAt,
    })
      .from(images)
      .where(where)
      .orderBy(desc(images.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(images).where(where),
  ])

  return {
    rows: rows.map((r) => ({ ...r, createdAt: r.createdAt?.toISOString() ?? null })),
    total: Number(count),
  }
}

export interface ImageUsageRef {
  type: 'Airline' | 'Office' | 'Blog'
  title: string
  href: string
  field: string
}

export interface ImageUsage {
  inUse: boolean
  refs: ImageUsageRef[]
}

// Two kinds of usage: hard FK references (logo/cover/hero/og columns — a delete
// would otherwise fail the FK constraint) and soft references inside Tiptap HTML
// (content/description embed /api/images/{id} but aren't FK-tracked).
export async function getImageUsage(id: string): Promise<ImageUsage> {
  const embed = `%/api/images/${id}%`

  const fkOr = (...conds: (SQL | undefined)[]) => or(...conds.filter((c): c is SQL => !!c))

  const [airlineRows, officeRows, blogRows] = await Promise.all([
    db.select({ slug: airlines.slug, name: airlines.name, logo: airlines.logoImageId, cover: airlines.coverImageId, og: airlines.ogImageId })
      .from(airlines)
      .where(fkOr(eq(airlines.logoImageId, id), eq(airlines.coverImageId, id), eq(airlines.ogImageId, id), like(airlines.description, embed))),
    db.select({ slug: offices.slug, title: offices.fullTitle, airlineSlug: airlines.slug, hero: offices.heroImageId, og: offices.ogImageId })
      .from(offices)
      .innerJoin(airlines, eq(offices.airlineId, airlines.id))
      .where(fkOr(eq(offices.heroImageId, id), eq(offices.ogImageId, id), like(offices.content, embed))),
    db.select({ slug: blogPosts.slug, title: blogPosts.title, hero: blogPosts.heroImageId, og: blogPosts.ogImageId })
      .from(blogPosts)
      .where(fkOr(eq(blogPosts.heroImageId, id), eq(blogPosts.ogImageId, id), like(blogPosts.content, embed))),
  ])

  const fieldOf = (map: Record<string, boolean>) =>
    Object.entries(map).filter(([, v]) => v).map(([k]) => k).join(', ') || 'content'

  const refs: ImageUsageRef[] = [
    ...airlineRows.map((a) => ({
      type: 'Airline' as const,
      title: a.name,
      href: `/admin/airlines/${a.slug}`,
      field: fieldOf({ logo: a.logo === id, cover: a.cover === id, og: a.og === id }),
    })),
    ...officeRows.map((o) => ({
      type: 'Office' as const,
      title: o.title,
      href: `/admin/offices/${o.airlineSlug}/${o.slug}`,
      field: fieldOf({ hero: o.hero === id, og: o.og === id }),
    })),
    ...blogRows.map((b) => ({
      type: 'Blog' as const,
      title: b.title,
      href: `/admin/blog/${b.slug}`,
      field: fieldOf({ hero: b.hero === id, og: b.og === id }),
    })),
  ]

  return { inUse: refs.length > 0, refs }
}
