'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, ne, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { cleanHtml } from '@/lib/sanitize'
import { ensureUniqueSlug } from '@/lib/slug'
import { deleteReplacedImage } from '@/lib/images'
import { isCurrentlyLive } from '@/lib/visibility'
import { resolveStatusFields } from '@/lib/validation/content'
import { logActivity } from '@/lib/activity'

function revalidateAirlinePaths(slug: string) {
  revalidatePath('/airlines')
  revalidatePath('/')
  revalidatePath(`/${slug}`)
  revalidatePath('/admin/airlines')
}

export async function saveAirline(formData: FormData) {
  const session = await requireRole('editor')
  const raw = Object.fromEntries(formData)
  const airlineId = raw.id ? parseInt(raw.id as string) : null

  const existing = airlineId
    ? (await db.select({
        slug: airlines.slug,
        status: airlines.status,
        scheduledAt: airlines.scheduledAt,
        publishedAt: airlines.publishedAt,
        logoImageId: airlines.logoImageId,
        coverImageId: airlines.coverImageId,
        ogImageId: airlines.ogImageId,
      }).from(airlines).where(eq(airlines.id, airlineId)))[0] ?? null
    : null

  const locked = existing ? isCurrentlyLive(existing) : false
  const slug = locked
    ? existing!.slug
    : await ensureUniqueSlug(raw.slug as string, async (candidate) => {
        const rows = await db.select({ id: airlines.id }).from(airlines).where(
          and(eq(airlines.slug, candidate), airlineId ? ne(airlines.id, airlineId) : undefined)
        )
        return rows.length > 0
      })

  const { status, scheduledAt, publishedAt } = resolveStatusFields(
    { status: raw.status as string, scheduledAt: (raw.scheduledAt as string) || null },
    existing?.publishedAt ?? null
  )

  const data = {
    slug,
    name: raw.name as string,
    iataCode: (raw.iataCode as string) || null,
    icaoCode: (raw.icaoCode as string) || null,
    logoImageId: (raw.logoImageId as string) || null,
    coverImageId: (raw.coverImageId as string) || null,
    description: cleanHtml(raw.description as string),
    website: (raw.website as string) || null,
    email: (raw.email as string) || null,
    phone: (raw.phone as string) || null,
    foundedYear: raw.foundedYear ? parseInt(raw.foundedYear as string) : null,
    alliance: (raw.alliance as string) || null,
    hqAddress: (raw.hqAddress as string) || null,
    hqPhone: (raw.hqPhone as string) || null,
    hqEmail: (raw.hqEmail as string) || null,
    facebook: (raw.facebook as string) || null,
    twitter: (raw.twitter as string) || null,
    instagram: (raw.instagram as string) || null,
    youtube: (raw.youtube as string) || null,
    isFeatured: raw.isFeatured === 'true',
    ogImageId: (raw.ogImageId as string) || null,
    metaTitle: (raw.metaTitle as string) || null,
    metaDescription: (raw.metaDescription as string) || null,
    canonicalUrl: (raw.canonicalUrl as string) || null,
    noindex: raw.noindex === 'true',
    status,
    scheduledAt,
    publishedAt,
    draftData: null,
    draftSavedAt: null,
  }

  let resolvedId: number | null = airlineId
  if (airlineId) {
    await db.update(airlines).set(data).where(eq(airlines.id, airlineId))

    await Promise.all([
      deleteReplacedImage(existing?.logoImageId, data.logoImageId),
      deleteReplacedImage(existing?.coverImageId, data.coverImageId),
      deleteReplacedImage(existing?.ogImageId, data.ogImageId),
    ])
  } else {
    const [result] = await db.insert(airlines).values(data)
    resolvedId = result.insertId
  }

  revalidateAirlinePaths(slug)
  await logActivity(session.user, {
    action: airlineId ? 'updated' : 'created',
    entityType: 'airline',
    entityId: resolvedId,
    entityTitle: data.name,
    href: `/admin/airlines/${slug}`,
  })
  redirect('/admin/airlines')
}

// Debounced autosave while editing — see src/app/admin/offices/actions.ts:autosaveOffice
// for the draft-vs-live buffering rationale (identical pattern, applied here to `description`).
export async function autosaveAirline(
  id: number,
  data: { description?: string; metaTitle?: string; metaDescription?: string }
) {
  await requireRole('editor')
  const [existing] = await db.select({ status: airlines.status, scheduledAt: airlines.scheduledAt })
    .from(airlines).where(eq(airlines.id, id))
  if (!existing) return { ok: false as const }

  if (isCurrentlyLive(existing)) {
    await db.update(airlines).set({ draftData: JSON.stringify(data), draftSavedAt: new Date() }).where(eq(airlines.id, id))
  } else {
    await db.update(airlines).set({
      description: data.description !== undefined ? cleanHtml(data.description) : undefined,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      draftData: null,
      draftSavedAt: new Date(),
    }).where(eq(airlines.id, id))
  }
  return { ok: true as const, savedAt: new Date().toISOString() }
}

export async function trashAirline(id: number) {
  const session = await requireRole('editor')
  const [airline] = await db.select({ slug: airlines.slug, name: airlines.name }).from(airlines).where(eq(airlines.id, id))
  if (!airline) return
  await db.update(airlines).set({ deletedAt: new Date() }).where(eq(airlines.id, id))
  revalidateAirlinePaths(airline.slug)
  revalidatePath('/admin/airlines/trash')
  await logActivity(session.user, { action: 'trashed', entityType: 'airline', entityId: id, entityTitle: airline.name })
}

export async function restoreAirline(id: number) {
  const session = await requireRole('admin')
  const [airline] = await db.select({ slug: airlines.slug, name: airlines.name }).from(airlines).where(eq(airlines.id, id))
  if (!airline) return
  await db.update(airlines).set({ deletedAt: null }).where(eq(airlines.id, id))
  revalidateAirlinePaths(airline.slug)
  revalidatePath('/admin/airlines/trash')
  await logActivity(session.user, { action: 'restored', entityType: 'airline', entityId: id, entityTitle: airline.name, href: `/admin/airlines/${airline.slug}` })
}

export async function deleteAirlinePermanently(id: number) {
  const session = await requireRole('admin')           // editors cannot delete
  const [airline] = await db.select({ slug: airlines.slug, name: airlines.name }).from(airlines).where(eq(airlines.id, id))
  await db.delete(airlines).where(eq(airlines.id, id))
  revalidatePath('/admin/airlines')
  revalidatePath('/admin/airlines/trash')
  revalidatePath(`/${airline?.slug ?? ''}`)
  await logActivity(session.user, { action: 'deleted', entityType: 'airline', entityId: id, entityTitle: airline?.name ?? null })
}
