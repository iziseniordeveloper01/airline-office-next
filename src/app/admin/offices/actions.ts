'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { eq, and, ne, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { offices, officeFaqs, airlines } from '@/lib/schema'
import { requireRole } from '@/lib/auth/requireRole'
import { cleanHtml } from '@/lib/sanitize'
import { ensureUniqueSlug } from '@/lib/slug'
import { deleteReplacedImage } from '@/lib/images'
import { isCurrentlyLive } from '@/lib/visibility'
import { resolveStatusFields } from '@/lib/validation/content'
import { logActivity } from '@/lib/activity'

const idsSchema = z.array(z.number().int().positive()).min(1)

async function revalidateOfficePaths(airlineId: number, slug: string) {
  revalidatePath('/admin/offices')
  revalidatePath('/')
  const [airline] = await db.select({ slug: airlines.slug }).from(airlines).where(eq(airlines.id, airlineId))
  if (airline) {
    revalidatePath(`/${airline.slug}`)
    revalidatePath(`/${airline.slug}/${slug}`)
  }
}

export async function saveOffice(formData: FormData) {
  const session = await requireRole('editor')
  const raw = Object.fromEntries(formData)
  const airlineId = parseInt(raw.airlineId as string)
  const officeId = raw.id ? parseInt(raw.id as string) : null

  const existing = officeId
    ? (await db.select({
        slug: offices.slug,
        status: offices.status,
        scheduledAt: offices.scheduledAt,
        publishedAt: offices.publishedAt,
        heroImageId: offices.heroImageId,
        ogImageId: offices.ogImageId,
      }).from(offices).where(eq(offices.id, officeId)))[0] ?? null
    : null

  // A live row's slug never changes from here — even if the request was tampered
  // with client-side — to avoid silently 404ing an indexed public URL.
  const locked = existing ? isCurrentlyLive(existing) : false
  const slug = locked
    ? existing!.slug
    : await ensureUniqueSlug(raw.slug as string, async (candidate) => {
        const rows = await db.select({ id: offices.id }).from(offices).where(
          and(
            eq(offices.airlineId, airlineId),
            eq(offices.slug, candidate),
            officeId ? ne(offices.id, officeId) : undefined
          )
        )
        return rows.length > 0
      })

  const { status, scheduledAt, publishedAt } = resolveStatusFields(
    { status: raw.status as string, scheduledAt: (raw.scheduledAt as string) || null },
    existing?.publishedAt ?? null
  )

  const officeData = {
    slug,
    airlineId,
    fullTitle:      raw.fullTitle as string,
    city:           raw.city as string,
    country:        raw.country as string,
    countryCode:    (raw.countryCode as string) || null,
    region:         (raw.region as string) || null,
    address:        (raw.address as string) || null,
    mapEmbedUrl:    (raw.mapEmbedUrl as string) || null,
    mapLat:         raw.mapLat ? raw.mapLat as string : null,
    mapLng:         raw.mapLng ? raw.mapLng as string : null,
    phone:          (raw.phone as string) || null,
    ctaPhone:       (raw.ctaPhone as string) || null,
    email:          (raw.email as string) || null,
    workingHours:   (raw.workingHours as string) || null,
    workingDays:    (raw.workingDays as string) || null,
    website:        (raw.website as string) || null,
    onlineCheckin:  (raw.onlineCheckin as string) || null,
    flightStatus:   (raw.flightStatus as string) || null,
    baggageInfo:    (raw.baggageInfo as string) || null,
    isHeadquarters: raw.isHeadquarters === 'true',
    heroImageId:    (raw.heroImageId as string) || null,
    ogImageId:      (raw.ogImageId as string) || null,
    facebook:       (raw.facebook as string) || null,
    twitter:        (raw.twitter as string) || null,
    instagram:      (raw.instagram as string) || null,
    youtube:        (raw.youtube as string) || null,
    linkedin:       (raw.linkedin as string) || null,
    content:        cleanHtml(raw.content as string),
    metaTitle:      (raw.metaTitle as string) || null,
    metaDescription:(raw.metaDescription as string) || null,
    canonicalUrl:   (raw.canonicalUrl as string) || null,
    noindex:        raw.noindex === 'true',
    isFeatured:     raw.isFeatured === 'true',
    status,
    scheduledAt,
    publishedAt,
    // An explicit save always supersedes any in-progress autosave buffer.
    draftData:      null,
    draftSavedAt:   null,
    updatedBy:      session.user.id,
  }

  let resolvedOfficeId: number

  if (officeId) {
    resolvedOfficeId = officeId

    await db.update(offices).set(officeData).where(eq(offices.id, officeId))
    await db.delete(officeFaqs).where(eq(officeFaqs.officeId, officeId))

    await Promise.all([
      deleteReplacedImage(existing?.heroImageId, officeData.heroImageId),
      deleteReplacedImage(existing?.ogImageId, officeData.ogImageId),
    ])
  } else {
    const [result] = await db.insert(offices).values(officeData)
    resolvedOfficeId = result.insertId
  }

  // FAQs — sent as JSON string in formData
  const faqsRaw = raw.faqs as string
  if (faqsRaw) {
    const faqs: Array<{ question: string; answer: string }> = JSON.parse(faqsRaw)
    if (faqs.length > 0) {
      await db.insert(officeFaqs).values(
        faqs.map((faq, i) => ({ officeId: resolvedOfficeId, question: faq.question, answer: faq.answer, sortOrder: i }))
      )
    }
  }

  await revalidateOfficePaths(airlineId, slug)
  const [al] = await db.select({ slug: airlines.slug }).from(airlines).where(eq(airlines.id, airlineId))
  await logActivity(session.user, {
    action: officeId ? 'updated' : 'created',
    entityType: 'office',
    entityId: resolvedOfficeId,
    entityTitle: raw.fullTitle as string,
    href: al ? `/admin/offices/${al.slug}/${slug}` : null,
  })
  redirect('/admin/offices')
}

// Debounced autosave while editing. Draft rows write straight through; a
// currently-live row's autosave is buffered in draftData so it never clobbers
// the published content — only an explicit "Save Changes" merges it live.
export async function autosaveOffice(
  id: number,
  data: { content?: string; metaTitle?: string; metaDescription?: string }
) {
  await requireRole('editor')
  const [existing] = await db.select({ status: offices.status, scheduledAt: offices.scheduledAt })
    .from(offices).where(eq(offices.id, id))
  if (!existing) return { ok: false as const }

  if (isCurrentlyLive(existing)) {
    await db.update(offices).set({ draftData: JSON.stringify(data), draftSavedAt: new Date() }).where(eq(offices.id, id))
  } else {
    await db.update(offices).set({
      content: data.content !== undefined ? cleanHtml(data.content) : undefined,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      draftData: null,
      draftSavedAt: new Date(),
    }).where(eq(offices.id, id))
  }
  return { ok: true as const, savedAt: new Date().toISOString() }
}

export async function trashOffice(id: number) {
  const session = await requireRole('editor')
  const [office] = await db.select({ slug: offices.slug, airlineId: offices.airlineId, fullTitle: offices.fullTitle }).from(offices).where(eq(offices.id, id))
  if (!office) return
  await db.update(offices).set({ deletedAt: new Date() }).where(eq(offices.id, id))
  await revalidateOfficePaths(office.airlineId, office.slug)
  revalidatePath('/admin/offices/trash')
  await logActivity(session.user, { action: 'trashed', entityType: 'office', entityId: id, entityTitle: office.fullTitle })
}

export async function restoreOffice(id: number) {
  const session = await requireRole('admin')
  const [office] = await db.select({ slug: offices.slug, airlineId: offices.airlineId, fullTitle: offices.fullTitle }).from(offices).where(eq(offices.id, id))
  if (!office) return
  await db.update(offices).set({ deletedAt: null }).where(eq(offices.id, id))
  await revalidateOfficePaths(office.airlineId, office.slug)
  revalidatePath('/admin/offices/trash')
  await logActivity(session.user, { action: 'restored', entityType: 'office', entityId: id, entityTitle: office.fullTitle })
}

export async function deleteOfficePermanently(id: number) {
  const session = await requireRole('admin')
  const [office] = await db.select({ slug: offices.slug, airlineId: offices.airlineId, fullTitle: offices.fullTitle }).from(offices).where(eq(offices.id, id))
  await db.delete(offices).where(eq(offices.id, id))
  await logActivity(session.user, { action: 'deleted', entityType: 'office', entityId: id, entityTitle: office?.fullTitle ?? null })
  revalidatePath('/admin/offices')
  revalidatePath('/admin/offices/trash')
  if (office) {
    const [airline] = await db.select({ slug: airlines.slug }).from(airlines).where(eq(airlines.id, office.airlineId))
    if (airline) {
      revalidatePath(`/${airline.slug}`)
      revalidatePath(`/${airline.slug}/${office.slug}`)
    }
  }
}

// Bulk actions — same role minimums and revalidation as their single-row
// counterparts above; the UI only ever hides a button by role, this re-check
// is the actual gate.
export async function bulkTrashOffices(ids: number[]) {
  await requireRole('editor')
  const parsed = idsSchema.parse(ids)
  const rows = await db.select({ slug: offices.slug, airlineId: offices.airlineId }).from(offices).where(inArray(offices.id, parsed))
  await db.update(offices).set({ deletedAt: new Date() }).where(inArray(offices.id, parsed))
  await Promise.all(rows.map((o) => revalidateOfficePaths(o.airlineId, o.slug)))
  revalidatePath('/admin/offices/trash')
}

export async function bulkRestoreOffices(ids: number[]) {
  await requireRole('admin')
  const parsed = idsSchema.parse(ids)
  const rows = await db.select({ slug: offices.slug, airlineId: offices.airlineId }).from(offices).where(inArray(offices.id, parsed))
  await db.update(offices).set({ deletedAt: null }).where(inArray(offices.id, parsed))
  await Promise.all(rows.map((o) => revalidateOfficePaths(o.airlineId, o.slug)))
  revalidatePath('/admin/offices/trash')
}

export async function bulkDeleteOfficesPermanently(ids: number[]) {
  await requireRole('admin')
  const parsed = idsSchema.parse(ids)
  const rows = await db.select({ slug: offices.slug, airlineId: offices.airlineId }).from(offices).where(inArray(offices.id, parsed))
  await db.delete(offices).where(inArray(offices.id, parsed))
  revalidatePath('/admin/offices')
  revalidatePath('/admin/offices/trash')
  await Promise.all(rows.map((o) => revalidateOfficePaths(o.airlineId, o.slug)))
}

// Loops the same resolveStatusFields() used by saveOffice, so bulk
// publish/unpublish can never drift from the single-row status rules
// (republish preserves publishedAt, unpublish nulls it). Never touches slug.
export async function bulkSetOfficeStatus(ids: number[], status: 'published' | 'draft') {
  await requireRole('editor')
  const parsed = idsSchema.parse(ids)
  const rows = await db.select({
    id: offices.id, slug: offices.slug, airlineId: offices.airlineId, publishedAt: offices.publishedAt,
  }).from(offices).where(inArray(offices.id, parsed))

  await Promise.all(
    rows.map((row) => {
      const fields = resolveStatusFields({ status, scheduledAt: null }, row.publishedAt)
      return db.update(offices).set(fields).where(eq(offices.id, row.id))
    })
  )
  await Promise.all(rows.map((o) => revalidateOfficePaths(o.airlineId, o.slug)))
}
