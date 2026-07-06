'use client'

import { useState } from 'react'
import Link from 'next/link'
import { saveBlogPost, autosaveBlogPost } from '@/app/admin/blog/actions'
import PostEditor from '@/components/admin/PostEditor'
import ImagePicker from '@/components/admin/ImagePicker'
import SubmitButton from '@/components/admin/SubmitButton'
import StatusControl, { type ContentStatus } from '@/components/admin/StatusControl'
import AutosaveIndicator from '@/components/admin/AutosaveIndicator'
import { generateSlug } from '@/lib/readingTime'
import { useAutosave } from '@/lib/useAutosave'
import type { blogPosts } from '@/lib/schema'
import type { CategoryWithCount } from '@/lib/data/getTaxonomy'

type BlogPostRow = typeof blogPosts.$inferSelect
type Faq = { question: string; answer: string }
type DraftBuffer = { content?: string; metaTitle?: string; metaDescription?: string }

interface Props {
  mode: 'new' | 'edit'
  initialData?: BlogPostRow & { faqs?: Faq[] }
  categories?: CategoryWithCount[]
  initialTags?: string[]
  isLive?: boolean
}

export default function BlogPostForm({ mode, initialData, categories = [], initialTags = [], isLive = false }: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'meta' | 'settings'>('content')

  const draft: DraftBuffer = initialData?.draftData ? JSON.parse(initialData.draftData) : {}

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [metaTitle, setMetaTitle] = useState(draft.metaTitle ?? initialData?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(draft.metaDescription ?? initialData?.metaDescription ?? '')
  const [content, setContent] = useState(draft.content ?? initialData?.content ?? '')
  const [status, setStatus] = useState<ContentStatus>(initialData?.status ?? 'draft')
  const [scheduledAt, setScheduledAt] = useState<string | null>(initialData?.scheduledAt?.toISOString() ?? null)
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(
    initialData?.faqs?.length ? initialData.faqs : [{ question: '', answer: '' }]
  )
  const [tags, setTags] = useState<string[]>(initialTags)
  const [tagDraft, setTagDraft] = useState('')

  // WP-style tag entry: Enter or comma commits the chip; duplicates ignored.
  const commitTag = () => {
    const name = tagDraft.trim().replace(/,+$/, '')
    if (name && !tags.some((t) => t.toLowerCase() === name.toLowerCase())) {
      setTags([...tags, name])
    }
    setTagDraft('')
  }
  const removeTag = (name: string) => setTags(tags.filter((t) => t !== name))

  const autosaveStatus = useAutosave(
    { content, metaTitle, metaDescription },
    (data) => autosaveBlogPost(initialData!.id, data),
    mode === 'edit'
  )

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (mode === 'new') setSlug(generateSlug(value))
    if (!metaTitle) setMetaTitle(value)
  }

  const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])
  const updateFaq = (i: number, field: 'question' | 'answer', val: string) => {
    const updated = [...faqs]
    updated[i] = { ...updated[i], [field]: val }
    setFaqs(updated)
  }
  const removeFaq = (i: number) => setFaqs(faqs.filter((_, idx) => idx !== i))

  const handleSubmit = (formData: FormData) => {
    if (status === 'scheduled' && (!scheduledAt || new Date(scheduledAt).getTime() <= Date.now())) {
      alert('Scheduled date must be in the future.')
      return
    }
    const cleanedFaqs = faqs.filter((f) => f.question.trim() && f.answer.trim())
    formData.set('faqs', JSON.stringify(cleanedFaqs))
    // Include an uncommitted tag the user typed but didn't press Enter on.
    const draft = tagDraft.trim().replace(/,+$/, '')
    const finalTags = draft && !tags.some((t) => t.toLowerCase() === draft.toLowerCase()) ? [...tags, draft] : tags
    formData.set('tags', JSON.stringify(finalTags))
    // initialData.relatedPosts is already a JSON string (raw `related_posts` text column) — pass through as-is
    formData.set('relatedPosts', initialData?.relatedPosts ?? '[]')
    return saveBlogPost(formData)
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900'
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide'
  const fieldCls = 'mb-5'

  const tabs = [
    { id: 'content', label: 'Content' },
    { id: 'meta', label: 'SEO Meta' },
    { id: 'settings', label: 'Settings' },
  ] as const

  return (
    <form action={handleSubmit} className="max-w-4xl">
      {initialData?.id && <input type="hidden" name="id" value={initialData.id} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === 'new' ? 'New Blog Post' : 'Edit Blog Post'}
          </h1>
          {mode === 'edit' && (
            <p className="text-xs text-gray-400 font-mono mt-1">{slug}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {mode === 'edit' && <AutosaveIndicator status={autosaveStatus} />}
          <Link href="/admin/blog" className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
          <SubmitButton>{mode === 'new' ? 'Publish Post' : 'Save Changes'}</SubmitButton>
        </div>
      </div>

      {/* Title — always visible */}
      <div className="mb-6">
        <input
          type="text"
          name="title"
          required
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Post title…"
          className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900 placeholder-gray-300"
        />
      </div>

      {/* Status — Draft / Publish / Schedule */}
      <div className="mb-6 p-4 border border-gray-200 rounded-xl bg-gray-50">
        <label className={labelCls}>Status</label>
        <StatusControl status={status} scheduledAt={scheduledAt} onChange={(s, d) => { setStatus(s); setScheduledAt(d) }} />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Content ── */}
      <div className={activeTab === 'content' ? '' : 'hidden'}>
        <div className={fieldCls}>
          <label className={labelCls}>Excerpt (short description)</label>
          <textarea
            name="excerpt"
            defaultValue={initialData?.excerpt ?? ''}
            placeholder="2-3 sentence summary jo blog listing aur search results mein dikhega…"
            rows={3}
            className={inputCls}
          />
        </div>

        <div className={fieldCls}>
          <label className={labelCls}>Content</label>
          <input type="hidden" name="content" value={content} />
          <PostEditor value={content} onChange={setContent} placeholder="Write your post…" />
        </div>

        <div className={fieldCls}>
          <div className="flex items-center justify-between mb-3">
            <label className={labelCls}>FAQs</label>
            <button type="button" onClick={addFaq} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              + Add FAQ
            </button>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-500">FAQ #{i + 1}</span>
                  {faqs.length > 1 && (
                    <button type="button" onClick={() => removeFaq(i)} className="text-xs text-red-400 hover:text-red-600">
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                  placeholder="Question…"
                  className={`${inputCls} mb-2`}
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  placeholder="Answer…"
                  rows={3}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB: SEO ── */}
      <div className={activeTab === 'meta' ? '' : 'hidden'}>
        <div className={fieldCls}>
          <label className={labelCls}>Meta Title</label>
          <input
            type="text"
            name="metaTitle"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Top Safest Airlines to Fly in the US (2026)"
            className={inputCls}
          />
          <p className={`mt-1 text-xs ${metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
            {metaTitle.length}/60 characters
          </p>
        </div>

        <div className={fieldCls}>
          <label className={labelCls}>Meta Description</label>
          <textarea
            name="metaDescription"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Discover the safest airlines in the US based on FAA audits, safety ratings…"
            rows={3}
            className={inputCls}
          />
        </div>

        <div className={`${fieldCls} mt-5`}>
          <ImagePicker label="OG Image" name="ogImageId" initialId={initialData?.ogImageId} />
        </div>

        <div className={fieldCls}>
          <label className={labelCls}>Canonical URL</label>
          <input type="url" name="canonicalUrl" defaultValue={initialData?.canonicalUrl ?? ''} placeholder="Leave blank to auto-generate" className={inputCls} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="noindex" value="true" defaultChecked={!!initialData?.noindex} className="w-4 h-4 accent-indigo-600" />
          <span className="text-sm text-gray-700">Hide from search engines (noindex)</span>
        </label>
      </div>

      {/* ── TAB: Settings ── */}
      <div className={activeTab === 'settings' ? '' : 'hidden'}>
        <div className="grid grid-cols-2 gap-5">
          <div className={fieldCls}>
            <label className={labelCls}>Slug (URL)</label>
            <input
              type="text"
              name="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="top-safest-airlines-2026"
              className={`${inputCls} font-mono`}
              readOnly={isLive}
            />
            {isLive && <p className="mt-1 text-xs text-amber-600">Slug is locked once live — this preserves your public URL.</p>}
          </div>

          <div className={fieldCls}>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace(' mb-1.5', '')}>Category</label>
              <Link href="/admin/blog/categories" className="text-xs text-indigo-600 hover:text-indigo-700">
                Manage
              </Link>
            </div>
            <select name="categoryId" defaultValue={initialData?.categoryId ?? ''} className={inputCls}>
              <option value="">— Uncategorized —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={`${fieldCls} col-span-2`}>
            <label className={labelCls}>Tags</label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-indigo-700" aria-label={`Remove tag ${tag}`}>
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag() }
                  if (e.key === 'Backspace' && !tagDraft && tags.length) removeTag(tags[tags.length - 1])
                }}
                onBlur={commitTag}
                placeholder={tags.length ? '' : 'Add tags — press Enter or comma…'}
                className="min-w-32 flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-gray-900 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">New tags are created automatically on save.</p>
          </div>

          <div className={fieldCls}>
            <label className={labelCls}>Author</label>
            <input
              type="text"
              name="author"
              defaultValue={initialData?.author ?? 'AirlinesOfficeList'}
              placeholder="AirlinesOfficeList"
              className={inputCls}
            />
          </div>

          <div className={fieldCls}>
            <ImagePicker label="Featured Image" name="heroImageId" initialId={initialData?.heroImageId} />
          </div>
        </div>
      </div>
    </form>
  )
}
