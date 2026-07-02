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

const CATEGORIES = [
  'Safety', 'Airport Guide', 'Travel Tips', 'Airline News',
  'Baggage', 'Check-in', 'Visa', 'General',
]

type BlogPostRow = typeof blogPosts.$inferSelect
type Faq = { question: string; answer: string }
type DraftBuffer = { content?: string; metaTitle?: string; metaDescription?: string }

interface Props {
  mode: 'new' | 'edit'
  initialData?: BlogPostRow & { faqs?: Faq[] }
  isLive?: boolean
}

export default function BlogPostForm({ mode, initialData, isLive = false }: Props) {
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
            <label className={labelCls}>Category</label>
            <select name="category" defaultValue={initialData?.category ?? 'General'} className={inputCls}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
