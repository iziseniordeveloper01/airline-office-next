'use client'

import { useRef, useState } from 'react'
import { Controller, useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { saveOffice, autosaveOffice } from '@/app/admin/offices/actions'
import PostEditor from '@/components/admin/PostEditor'
import ImagePicker from '@/components/admin/ImagePicker'
import SubmitButton from '@/components/admin/SubmitButton'
import StatusControl from '@/components/admin/StatusControl'
import AutosaveIndicator from '@/components/admin/AutosaveIndicator'
import { generateSlug } from '@/lib/readingTime'
import { useAutosave } from '@/lib/useAutosave'
import { isRedirectError } from '@/lib/isRedirectError'
import { officeFormSchema, type OfficeFormValues } from '@/lib/validation/office'
import type { offices } from '@/lib/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

type OfficeRow = typeof offices.$inferSelect
type Faq = { question: string; answer: string }
type DraftBuffer = { content?: string; metaTitle?: string; metaDescription?: string }

interface Props {
  mode: 'new' | 'edit'
  initialData?: OfficeRow & { faqs?: Faq[] }
  airlines: { id: number; slug: string; name: string; iataCode: string }[]
  isLive?: boolean
}

// Hoisted to module scope (not redefined every render) — see PostEditor's
// ToolbarButton for why: a component literal in the render body remounts on
// every parent re-render and fights the React Compiler.
function ValidatedField({
  form,
  name,
  label,
  placeholder,
  className,
}: {
  form: UseFormReturn<OfficeFormValues>
  name: 'fullTitle' | 'city' | 'country'
  label: string
  placeholder?: string
  className?: string
}) {
  const error = form.formState.errors[name]
  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input id={name} placeholder={placeholder} aria-invalid={!!error} {...form.register(name)} />
      <FieldError errors={[error]} />
    </Field>
  )
}

export default function OfficeForm({ mode, initialData, airlines, isLive = false }: Props) {
  const [activeTab, setActiveTab] = useState('basic')
  const formRef = useRef<HTMLFormElement>(null)

  // A pending autosave buffer (only ever written while the row is live) takes
  // precedence over the live columns so the editor resumes their in-progress edit.
  const draft: DraftBuffer = initialData?.draftData ? JSON.parse(initialData.draftData) : {}

  const form = useForm<OfficeFormValues>({
    resolver: zodResolver(officeFormSchema),
    defaultValues: {
      airlineId: initialData?.airlineId ?? 0,
      fullTitle: initialData?.fullTitle ?? '',
      slug: initialData?.slug ?? '',
      city: initialData?.city ?? '',
      country: initialData?.country ?? '',
      status: initialData?.status ?? 'draft',
      scheduledAt: initialData?.scheduledAt?.toISOString() ?? null,
      content: draft.content ?? initialData?.content ?? '',
      metaTitle: draft.metaTitle ?? initialData?.metaTitle ?? '',
      metaDescription: draft.metaDescription ?? initialData?.metaDescription ?? '',
    },
  })
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = form

  const [isFeatured, setIsFeatured] = useState(!!initialData?.isFeatured)
  const [isHeadquarters, setIsHeadquarters] = useState(!!initialData?.isHeadquarters)
  const [noindex, setNoindex] = useState(!!initialData?.noindex)
  const [faqs, setFaqs] = useState<Faq[]>(initialData?.faqs?.length ? initialData.faqs : [{ question: '', answer: '' }])

  const [content, metaTitle, metaDescription] = useWatch({ control, name: ['content', 'metaTitle', 'metaDescription'] })
  const status = watch('status')
  const scheduledAt = watch('scheduledAt')
  const slug = watch('slug')

  const autosaveStatus = useAutosave(
    { content, metaTitle, metaDescription },
    (data) => autosaveOffice(initialData!.id, data),
    mode === 'edit'
  )

  const handleTitleChange = (title: string) => {
    if (mode === 'new') setValue('slug', generateSlug(title))
    if (!metaTitle) setValue('metaTitle', title)
  }

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const updateFaq = (i: number, key: 'question' | 'answer', val: string) => {
    const updated = [...faqs]
    updated[i] = { ...updated[i], [key]: val }
    setFaqs(updated)
  }
  const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i))

  const onValid = async () => {
    const fd = new FormData(formRef.current!)
    const cleanedFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim())
    fd.set('faqs', JSON.stringify(cleanedFaqs))
    try {
      await saveOffice(fd)
    } catch (err) {
      if (isRedirectError(err)) throw err
      toast.error('Failed to save office')
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'contact', label: 'Contact' },
    { id: 'content', label: 'Content' },
    { id: 'social', label: 'Social' },
    { id: 'faq', label: `FAQs (${faqs.filter((f) => f.question).length})` },
    { id: 'seo', label: 'SEO' },
  ]

  return (
    <form ref={formRef} onSubmit={handleSubmit(onValid)} className="max-w-4xl space-y-6">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}
      <input type="hidden" name="isFeatured" value={isFeatured ? 'true' : ''} />
      <input type="hidden" name="isHeadquarters" value={isHeadquarters ? 'true' : ''} />
      <input type="hidden" name="noindex" value={noindex ? 'true' : ''} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{mode === 'new' ? 'New Office' : 'Edit Office'}</h1>
        <div className="flex items-center gap-3">
          {mode === 'edit' && <AutosaveIndicator status={autosaveStatus} />}
          <Button asChild variant="outline">
            <Link href="/admin/offices">Cancel</Link>
          </Button>
          <SubmitButton>{mode === 'new' ? 'Create Office' : 'Save Changes'}</SubmitButton>
        </div>
      </div>

      <Field data-invalid={!!errors.fullTitle}>
        <Input
          className="h-12 text-lg font-semibold"
          placeholder="Qatar Airways London Office in England"
          aria-invalid={!!errors.fullTitle}
          {...register('fullTitle', { onChange: (e) => handleTitleChange(e.target.value) })}
        />
        <FieldError errors={[errors.fullTitle]} />
      </Field>

      <div className="rounded-xl border bg-muted/30 p-4">
        <Label className="mb-2 block">Status</Label>
        <StatusControl status={status} scheduledAt={scheduledAt ?? null} onChange={(s, d) => { setValue('status', s); setValue('scheduledAt', d) }} />
        <FieldError errors={[errors.scheduledAt]} />
      </div>

      {/* Every TabsContent is forceMount'ed: onValid builds the payload with
          new FormData(form), and Radix unmounts inactive panels by default —
          which silently dropped all off-tab fields (slug, airlineId, …) and
          crashed saveOffice server-side whenever Save was clicked from any tab
          but Basic. forceMount keeps every input in the DOM (inactive panels
          are CSS-hidden via tabs.tsx) so the FormData is always complete. */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => <TabsTrigger key={tab.id} value={tab.id}>{tab.label}</TabsTrigger>)}
        </TabsList>

        <TabsContent forceMount value="basic" className="grid grid-cols-2 gap-5">
          <Field className="col-span-2">
            <FieldLabel>Airline *</FieldLabel>
            <Controller
              control={control}
              name="airlineId"
              render={({ field, fieldState }) => (
                <>
                  <input type="hidden" name="airlineId" value={field.value || ''} />
                  <Select value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger aria-invalid={!!fieldState.error} className="w-full">
                      <SelectValue placeholder="Select airline…" />
                    </SelectTrigger>
                    <SelectContent>
                      {airlines.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name} ({a.iataCode})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </>
              )}
            />
          </Field>

          <Field data-invalid={!!errors.slug}>
            <FieldLabel htmlFor="slug">Slug *</FieldLabel>
            <Input id="slug" className="font-mono" readOnly={isLive} aria-invalid={!!errors.slug} {...register('slug')} />
            {isLive ? (
              <FieldDescription className="text-amber-600">Slug is locked once live — this preserves your public URL.</FieldDescription>
            ) : (
              <FieldDescription className="font-mono">yoursite.com/airline-slug/{slug || '…'}/</FieldDescription>
            )}
            <FieldError errors={[errors.slug]} />
          </Field>

          <ValidatedField form={form} name="city" label="City *" placeholder="London" />
          <ValidatedField form={form} name="country" label="Country *" placeholder="United Kingdom" />

          <Field>
            <FieldLabel htmlFor="countryCode">Country Code</FieldLabel>
            <Input
              id="countryCode"
              defaultValue={initialData?.countryCode ?? ''}
              name="countryCode"
              placeholder="GB"
              maxLength={2}
              className="font-mono uppercase"
              onInput={(e) => { e.currentTarget.value = e.currentTarget.value.toUpperCase() }}
            />
          </Field>

          <Field>
            <FieldLabel>Region</FieldLabel>
            <Select name="region" defaultValue={initialData?.region ?? ''}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select region" /></SelectTrigger>
              <SelectContent>
                {['Asia', 'Europe', 'North America', 'South America', 'Middle East', 'Africa', 'Oceania'].map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <ImagePicker label="Hero Image" name="heroImageId" initialId={initialData?.heroImageId} />
          <ImagePicker label="OG Image" name="ogImageId" initialId={initialData?.ogImageId} />

          <div className="col-span-2 flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="isFeatured" checked={isFeatured} onCheckedChange={(v) => setIsFeatured(!!v)} />
              <Label htmlFor="isFeatured" className="font-normal">Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isHeadquarters" checked={isHeadquarters} onCheckedChange={(v) => setIsHeadquarters(!!v)} />
              <Label htmlFor="isHeadquarters" className="font-normal">Is Headquarters</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent forceMount value="contact" className="grid grid-cols-2 gap-5">
          <Field className="col-span-2">
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Textarea id="address" name="address" defaultValue={initialData?.address ?? ''} rows={2} placeholder="10-11 Conduit St, London W1S 2QR" />
          </Field>
          <Field><FieldLabel htmlFor="phone">Phone</FieldLabel><Input id="phone" name="phone" defaultValue={initialData?.phone ?? ''} placeholder="+44 330 024 0104" /></Field>
          <Field><FieldLabel htmlFor="ctaPhone">CTA Phone (displayed prominently)</FieldLabel><Input id="ctaPhone" name="ctaPhone" defaultValue={initialData?.ctaPhone ?? ''} placeholder="+1-877-294-7147" /></Field>
          <Field><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" type="email" name="email" defaultValue={initialData?.email ?? ''} placeholder="office@airline.com" /></Field>
          <Field><FieldLabel htmlFor="website">Website</FieldLabel><Input id="website" type="url" name="website" defaultValue={initialData?.website ?? ''} placeholder="https://www.airline.com" /></Field>
          <Field><FieldLabel htmlFor="workingHours">Working Hours</FieldLabel><Input id="workingHours" name="workingHours" defaultValue={initialData?.workingHours ?? '9:00 AM to 5:30 PM'} /></Field>
          <Field><FieldLabel htmlFor="workingDays">Working Days</FieldLabel><Input id="workingDays" name="workingDays" defaultValue={initialData?.workingDays ?? 'Monday - Friday'} /></Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="mapEmbedUrl">Google Maps Embed URL</FieldLabel>
            <Input id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={initialData?.mapEmbedUrl ?? ''} placeholder="https://www.google.com/maps/embed?pb=..." className="font-mono text-xs" />
          </Field>
          <Field><FieldLabel htmlFor="mapLat">Latitude</FieldLabel><Input id="mapLat" type="number" name="mapLat" defaultValue={initialData?.mapLat ?? ''} placeholder="51.5126" step="any" /></Field>
          <Field><FieldLabel htmlFor="mapLng">Longitude</FieldLabel><Input id="mapLng" type="number" name="mapLng" defaultValue={initialData?.mapLng ?? ''} placeholder="-0.1441" step="any" /></Field>
          <Field><FieldLabel htmlFor="onlineCheckin">Online Check-in URL</FieldLabel><Input id="onlineCheckin" type="url" name="onlineCheckin" defaultValue={initialData?.onlineCheckin ?? ''} placeholder="https://..." /></Field>
          <Field><FieldLabel htmlFor="flightStatus">Flight Status URL</FieldLabel><Input id="flightStatus" type="url" name="flightStatus" defaultValue={initialData?.flightStatus ?? ''} placeholder="https://..." /></Field>
          <Field><FieldLabel htmlFor="baggageInfo">Baggage Info URL</FieldLabel><Input id="baggageInfo" type="url" name="baggageInfo" defaultValue={initialData?.baggageInfo ?? ''} placeholder="https://..." /></Field>
        </TabsContent>

        <TabsContent forceMount value="content">
          <p className="mb-3 text-sm text-muted-foreground">
            Type or paste the full page body here — intro, overview, services list, airport details, fleet table, map description, conclusion. Use headings (H2/H3) and tables freely.
          </p>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <>
                <input type="hidden" name="content" value={field.value ?? ''} />
                <PostEditor value={field.value ?? ''} onChange={field.onChange} placeholder="Write the office page content…" />
              </>
            )}
          />
        </TabsContent>

        <TabsContent forceMount value="social" className="grid grid-cols-2 gap-5">
          {(['facebook', 'twitter', 'instagram', 'youtube', 'linkedin'] as const).map((platform) => (
            <Field key={platform}>
              <FieldLabel htmlFor={platform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</FieldLabel>
              <Input id={platform} type="url" name={platform} defaultValue={initialData?.[platform] ?? ''} placeholder={`https://www.${platform}.com/airline`} />
            </Field>
          ))}
        </TabsContent>

        <TabsContent forceMount value="faq">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{faqs.filter((f) => f.question).length} FAQs</p>
            <Button type="button" variant="ghost" size="sm" onClick={addFaq}><Plus className="h-4 w-4" /> Add FAQ</Button>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="mb-2 flex justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">FAQ #{i + 1}</span>
                  {faqs.length > 1 && (
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => removeFaq(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Input value={faq.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} placeholder="Question…" className="mb-2" />
                <Textarea value={faq.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} rows={3} placeholder="Answer…" />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent forceMount value="seo" className="space-y-5">
          <Field>
            <FieldLabel htmlFor="metaTitle">Meta Title</FieldLabel>
            <Input id="metaTitle" placeholder="Qatar Airways London Office +1-877-294-7147" {...register('metaTitle')} />
            <FieldDescription className={(metaTitle?.length ?? 0) > 60 ? 'text-destructive' : ''}>{metaTitle?.length ?? 0}/60</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="metaDescription">Meta Description</FieldLabel>
            <Textarea id="metaDescription" rows={3} placeholder="Find Qatar Airways London office address, phone number..." {...register('metaDescription')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="canonicalUrl">Canonical URL</FieldLabel>
            <Input id="canonicalUrl" type="url" name="canonicalUrl" defaultValue={initialData?.canonicalUrl ?? ''} placeholder="Leave blank to auto-generate" />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox id="noindex" checked={noindex} onCheckedChange={(v) => setNoindex(!!v)} />
            <Label htmlFor="noindex" className="font-normal">Hide from search engines (noindex)</Label>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  )
}
