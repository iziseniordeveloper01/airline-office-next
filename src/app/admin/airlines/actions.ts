'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { eq, ne, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { airlines, offices } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { cleanHtml } from '@/lib/sanitize'
import { ensureUniqueSlug } from '@/lib/slug'
import { deleteReplacedImage } from '@/lib/images'
import { isCurrentlyLive } from '@/lib/visibility'
import { recordRedirect } from '@/lib/redirects'
import { pingIndexNow } from '@/lib/indexnow'
import { resolveStatusFields } from '@/lib/validation/content'
import { safeUrl } from '@/lib/validation/urls'
import { bustTags, CACHE_TAGS } from '@/lib/cache'
import { logActivity } from '@/lib/activity'

// Server-side guard for a saveAirline request — the browser form validation
// doesn't protect a tampered/direct POST.
const airlineServerSchema = z.object({
  name: z.string().trim().min(1, { message: 'Airline name is required' }).max(200),
})

function revalidateAirlinePaths(slug: string) {
  // Airline data feeds the homepage, hub and footer via the `airlines` tag.
  bustTags(CACHE_TAGS.airlines)
  revalidatePath('/airlines')
  revalidatePath('/')
  revalidatePath(`/${slug}`)
  revalidatePath('/admin/airlines')
}

export async function saveAirline(formData: FormData) {
  const session = await requireRole('editor')
  const raw = Object.fromEntries(formData)
  const { name } = airlineServerSchema.parse(raw)
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

  // Slug is editable at any time, live or not (any role) — a rename records a
  // redirect below instead of being blocked, so the old public URL keeps working.
  const slug = await ensureUniqueSlug(raw.slug as string, async (candidate) => {
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
    name,
    iataCode: (raw.iataCode as string) || null,
    icaoCode: (raw.icaoCode as string) || null,
    logoImageId: (raw.logoImageId as string) || null,
    coverImageId: (raw.coverImageId as string) || null,
    description: cleanHtml(raw.description as string),
    // URL fields rendered into public href — scheme-validated (no javascript:).
    website: safeUrl(raw.website),
    email: (raw.email as string) || null,
    phone: (raw.phone as string) || null,
    foundedYear: raw.foundedYear ? parseInt(raw.foundedYear as string) : null,
    alliance: (raw.alliance as string) || null,
    hqAddress: (raw.hqAddress as string) || null,
    hqPhone: (raw.hqPhone as string) || null,
    hqEmail: (raw.hqEmail as string) || null,
    facebook: safeUrl(raw.facebook),
    twitter: safeUrl(raw.twitter),
    instagram: safeUrl(raw.instagram),
    youtube: safeUrl(raw.youtube),
    isFeatured: raw.isFeatured === 'true',
    ogImageId: (raw.ogImageId as string) || null,
    metaTitle: (raw.metaTitle as string) || null,
    metaDescription: (raw.metaDescription as string) || null,
    canonicalUrl: safeUrl(raw.canonicalUrl),
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

  // Slug changed on an existing row — redirect its old URL, and every office
  // under it (their own slug is unchanged, but the airline prefix in their URL
  // just moved too).
  if (existing && existing.slug !== slug) {
    await recordRedirect(`/${existing.slug}`, `/${slug}`)
    const childOffices = await db.select({ slug: offices.slug }).from(offices).where(eq(offices.airlineId, airlineId!))
    await Promise.all(
      childOffices.map((o) => recordRedirect(`/${existing.slug}/${o.slug}`, `/${slug}/${o.slug}`))
    )
  }

  if (status === 'published') {
    await pingIndexNow([`${process.env.NEXT_PUBLIC_SITE_URL}/${slug}/`])
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
  bustTags(CACHE_TAGS.airlines, CACHE_TAGS.offices)
  revalidatePath('/admin/airlines')
  revalidatePath('/admin/airlines/trash')
  revalidatePath(`/${airline?.slug ?? ''}`)
  await logActivity(session.user, { action: 'deleted', entityType: 'airline', entityId: id, entityTitle: airline?.name ?? null })
}
