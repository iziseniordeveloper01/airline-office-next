export type SeoLevel = 'good' | 'ok' | 'poor'

export interface SeoMessage {
  level: SeoLevel
  text: string
}

export interface SeoScoreResult {
  level: SeoLevel
  score: number
  messages: SeoMessage[]
}

export interface SeoScoreInput {
  metaTitle: string
  metaDescription: string
  slug: string
  /** Stripped-HTML body text — omit to skip the content-length check entirely (e.g. a form with no body field). */
  contentText?: string
  /** Word-count floor for the content-length check. Default 300 (blog/office); pass 100 for airlines — matches getContentHealth's existing thresholds. */
  minWords?: number
  hasImage: boolean
  noindex: boolean
}

// Weights sum to 100. Mirrors the fields these forms actually have — there's no
// keyword column in the schema, so this scores structure/completeness rather
// than keyword density.
const WEIGHTS = { title: 25, description: 25, image: 15, slug: 10, content: 15, noindex: 10 }

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function scoreSeo(input: SeoScoreInput): SeoScoreResult {
  const { metaTitle, metaDescription, slug, contentText, minWords = 300, hasImage, noindex } = input
  const messages: SeoMessage[] = []
  let score = 0

  const titleLen = metaTitle.trim().length
  if (titleLen === 0) {
    messages.push({ level: 'poor', text: 'Meta title is missing.' })
  } else if (titleLen < 30 || titleLen > 60) {
    score += WEIGHTS.title * 0.5
    messages.push({ level: 'ok', text: `Meta title is ${titleLen} characters — aim for 30–60.` })
  } else {
    score += WEIGHTS.title
  }

  const descLen = metaDescription.trim().length
  if (descLen === 0) {
    messages.push({ level: 'poor', text: 'Meta description is missing.' })
  } else if (descLen < 120 || descLen > 160) {
    score += WEIGHTS.description * 0.5
    messages.push({ level: 'ok', text: `Meta description is ${descLen} characters — aim for 120–160.` })
  } else {
    score += WEIGHTS.description
  }

  if (hasImage) {
    score += WEIGHTS.image
  } else {
    messages.push({ level: 'poor', text: 'No image set (used for social/OG previews).' })
  }

  const slugLen = slug.trim().length
  if (slugLen === 0) {
    messages.push({ level: 'poor', text: 'Slug is missing.' })
  } else if (slugLen > 75) {
    score += WEIGHTS.slug * 0.5
    messages.push({ level: 'ok', text: 'Slug is long — shorter URLs tend to perform better.' })
  } else {
    score += WEIGHTS.slug
  }

  if (contentText === undefined) {
    score += WEIGHTS.content
  } else {
    const words = wordCount(contentText)
    if (words >= minWords) {
      score += WEIGHTS.content
    } else {
      score += WEIGHTS.content * (words / minWords)
      messages.push({ level: 'ok', text: `Content is ${words} words — aim for at least ${minWords}.` })
    }
  }

  if (noindex) {
    messages.push({ level: 'poor', text: 'Hidden from search engines (noindex).' })
  } else {
    score += WEIGHTS.noindex
  }

  const rounded = Math.round(score)
  // noindex overrides the numeric score — it's worth only 10/100 points, but a
  // noindexed page won't be indexed at all regardless of how complete its other
  // fields are, which is a more severe problem than the score alone implies.
  const level: SeoLevel = noindex ? 'poor' : rounded >= 80 ? 'good' : rounded >= 50 ? 'ok' : 'poor'
  messages.sort((a, b) => (a.level === b.level ? 0 : a.level === 'poor' ? -1 : b.level === 'poor' ? 1 : 0))

  return { level, score: rounded, messages }
}
