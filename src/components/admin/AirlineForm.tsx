'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { saveAirline, autosaveAirline } from '@/app/admin/airlines/actions'
import PostEditor from '@/components/admin/PostEditor'
import ImagePicker from '@/components/admin/ImagePicker'
import SubmitButton from '@/components/admin/SubmitButton'
import StatusControl, { type ContentStatus } from '@/components/admin/StatusControl'
import AutosaveIndicator from '@/components/admin/AutosaveIndicator'
import SeoScoreIndicator from '@/components/admin/SeoScoreIndicator'
import { generateSlug } from '@/lib/readingTime'
import { useAutosave } from '@/lib/useAutosave'
import { airlinePreviewHref } from '@/lib/previewHref'
import { scoreSeo } from '@/lib/seo/scoreSeo'
import type { airlines } from '@/lib/schema'

type AirlineRow = typeof airlines.$inferSelect
type DraftBuffer = { description?: string; metaTitle?: string; metaDescription?: string }

interface Props {
  mode: 'new' | 'edit'
  initialData?: AirlineRow
  isLive?: boolean
}

export default function AirlineForm({ mode, initialData, isLive = false }: Props) {
  const draft: DraftBuffer = initialData?.draftData ? JSON.parse(initialData.draftData) : {}

  const [name, setName] = useState(initialData?.name ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [metaTitle, setMetaTitle] = useState(draft.metaTitle ?? initialData?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(draft.metaDescription ?? initialData?.metaDescription ?? '')
  const [description, setDescription] = useState(draft.description ?? initialData?.description ?? '')
  const [isFeatured, setIsFeatured] = useState(!!initialData?.isFeatured)
  const [status, setStatus] = useState<ContentStatus>(initialData?.status ?? 'draft')
  const [scheduledAt, setScheduledAt] = useState<string | null>(initialData?.scheduledAt?.toISOString() ?? null)
  const [logoImageId, setLogoImageId] = useState(initialData?.logoImageId ?? '')
  const [noindex, setNoindex] = useState(!!initialData?.noindex)

  const seoResult = useMemo(() => scoreSeo({
    metaTitle,
    metaDescription,
    slug,
    contentText: description.replace(/<[^>]+>/g, ' '),
    minWords: 100,
    hasImage: !!logoImageId,
    noindex,
  }), [metaTitle, metaDescription, slug, description, logoImageId, noindex])

  const autosaveStatus = useAutosave(
    { description, metaTitle, metaDescription },
    (data) => autosaveAirline(initialData!.id, data),
    mode === 'edit'
  )

  const handleNameChange = (value: string) => {
    setName(value)
    if (mode === 'new') setSlug(generateSlug(value))
    if (!metaTitle) setMetaTitle(`${value} Offices Worldwide`)
  }

  const handleSubmit = (formData: FormData) => {
    if (status === 'scheduled' && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) {
      alert('Scheduled date must be in the future.')
      return
    }
    return saveAirline(formData)
  }

  // Token-based so the form matches the shadcn admin and adapts to dark mode
  // (the old bg-white/border-gray-300 classes were light-mode only).
  const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50'
  const lbl = 'block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide'
  const fld = 'mb-5'

  return (
    <form action={handleSubmit} className="max-w-3xl">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === 'new' ? 'New Airline' : `Edit: ${name}`}
        </h1>
        <div className="flex items-center gap-3">
          {mode === 'edit' && <AutosaveIndicator status={autosaveStatus} />}
          {mode === 'edit' && initialData && (
            <a
              href={airlinePreviewHref(initialData.status, initialData.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm border rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              Preview
            </a>
          )}
          <Link href="/admin/airlines" className="px-4 py-2 text-sm border rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            Cancel
          </Link>
          <SubmitButton>{mode === 'new' ? 'Create Airline' : 'Save Changes'}</SubmitButton>
        </div>
      </div>

      {/* Status — Draft / Publish / Schedule */}
      <div className="mb-5 p-4 border rounded-xl bg-muted/40">
        <label className={lbl}>Status</label>
        <StatusControl status={status} scheduledAt={scheduledAt} onChange={(s, d) => { setStatus(s); setScheduledAt(d) }} />
      </div>

      {/* Basic Info */}
      <div className="bg-card border rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b">Basic Information</h2>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className={lbl}>Airline Name *</label>
            <input type="text" name="name" required value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Qatar Airways" className={inp} />
          </div>
          <div>
            <label className={lbl}>Slug (URL) *</label>
            <input type="text" name="slug" required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="qatar-airways" className={`${inp} font-mono`} />
            {isLive ? (
              <p className="mt-1 text-xs text-amber-600">Changing this updates the live public URL — the old link will redirect automatically.</p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground font-mono">yoursite.com/{slug || '…'}/</p>
            )}
          </div>
          <div>
            <label className={lbl}>IATA Code *</label>
            <input type="text" name="iataCode" required defaultValue={initialData?.iataCode ?? ''} placeholder="QR" maxLength={2} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toUpperCase() }} className={`${inp} font-mono uppercase`} />
          </div>
          <div>
            <label className={lbl}>ICAO Code</label>
            <input type="text" name="icaoCode" defaultValue={initialData?.icaoCode ?? ''} placeholder="QTR" maxLength={4} onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toUpperCase() }} className={`${inp} font-mono uppercase`} />
          </div>
          <div>
            <label className={lbl}>Founded Year</label>
            <input type="number" name="foundedYear" defaultValue={initialData?.foundedYear ?? ''} placeholder="1993" className={inp} />
          </div>
          <div>
            <label className={lbl}>Alliance</label>
            <select name="alliance" defaultValue={initialData?.alliance ?? ''} className={inp}>
              <option value="">None</option>
              <option value="oneworld">Oneworld</option>
              <option value="star-alliance">Star Alliance</option>
              <option value="skyteam">SkyTeam</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Website</label>
            <input type="url" name="website" defaultValue={initialData?.website ?? ''} placeholder="https://www.airline.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Email</label>
            <input type="email" name="email" defaultValue={initialData?.email ?? ''} placeholder="info@airline.com" className={inp} />
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <input type="text" name="phone" defaultValue={initialData?.phone ?? ''} placeholder="+974 4144 5555" className={inp} />
          </div>
          <ImagePicker label="Logo" name="logoImageId" initialId={initialData?.logoImageId} onChange={setLogoImageId} />
          <ImagePicker label="Cover Image" name="coverImageId" initialId={initialData?.coverImageId} />
          <div className="col-span-2 flex items-center gap-3">
            <input type="checkbox" id="isFeatured" name="isFeatured" value="true" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="isFeatured" className="text-sm text-foreground">Featured airline (homepage pe dikhega)</label>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-card border rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b">Description</h2>
        <input type="hidden" name="description" value={description} />
        <PostEditor value={description} onChange={setDescription} placeholder="About this airline…" />
      </div>

      {/* Headquarters */}
      <div className="bg-card border rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b">Headquarters</h2>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2">
            <label className={lbl}>HQ Address</label>
            <input type="text" name="hqAddress" defaultValue={initialData?.hqAddress ?? ''} placeholder="Qatar Airways Tower, Doha, Qatar" className={inp} />
          </div>
          <div>
            <label className={lbl}>HQ Phone</label>
            <input type="text" name="hqPhone" defaultValue={initialData?.hqPhone ?? ''} placeholder="+974 4144 5555" className={inp} />
          </div>
          <div>
            <label className={lbl}>HQ Email</label>
            <input type="email" name="hqEmail" defaultValue={initialData?.hqEmail ?? ''} placeholder="hq@airline.com" className={inp} />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-card border rounded-xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 pb-2 border-b">Social Media</h2>
        <div className="grid grid-cols-2 gap-5">
          {(['facebook', 'twitter', 'instagram', 'youtube'] as const).map((platform) => (
            <div key={platform}>
              <label className={lbl}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</label>
              <input type="url" name={platform} defaultValue={initialData?.[platform] ?? ''} placeholder={`https://www.${platform}.com/airline`} className={inp} />
            </div>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-card border rounded-xl p-6 mb-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h2 className="text-sm font-semibold text-foreground">SEO</h2>
          <SeoScoreIndicator result={seoResult} />
        </div>
        <div className={fld}>
          <label className={lbl}>Meta Title</label>
          <input type="text" name="metaTitle" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Qatar Airways Offices Worldwide" className={inp} />
          <p className={`mt-1 text-xs ${metaTitle.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>{metaTitle.length}/60</p>
        </div>
        <div className={fld}>
          <label className={lbl}>Meta Description</label>
          <textarea name="metaDescription" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} placeholder="Find all Qatar Airways office locations..." className={inp} />
        </div>
        <div className={fld}>
          <ImagePicker label="OG Image" name="ogImageId" initialId={initialData?.ogImageId} />
        </div>
        <div className={fld}>
          <label className={lbl}>Canonical URL</label>
          <input type="url" name="canonicalUrl" defaultValue={initialData?.canonicalUrl ?? ''} placeholder="Leave blank to auto-generate" className={inp} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="noindex" value="true" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="w-4 h-4 accent-primary" />
          <span className="text-sm text-foreground">Hide from search engines (noindex)</span>
        </label>
      </div>
    </form>
  )
}
