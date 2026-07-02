// ─── Auth ──────────────────────────────────────────────────────────────────

export type Role = 'editor' | 'admin' | 'super_admin'

// ─── Airline ───────────────────────────────────────────────────────────────

export interface AirlineIndex {
  slug: string
  name: string
  iataCode: string
  logo: string
  isFeatured: boolean
  officeCount: number
  hqAddress: string
  hqPhone: string
  hqEmail: string
}

export interface Airline {
  slug: string
  name: string
  iataCode: string
  icaoCode: string
  logo: string
  coverImage?: string
  description: string
  website: string
  email: string
  phone: string
  foundedYear: number
  alliance?: string
  headquarters: {
    address: string
    phone: string
    email: string
  }
  socialMedia: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
  }
  metaTitle: string
  metaDescription: string
  ogImage?: string
  canonicalUrl?: string
  noindex: boolean
  updatedAt: string
}

// ─── Office ────────────────────────────────────────────────────────────────

export interface FAQ {
  question: string
  answer: string
}

export interface Office {
  id: number
  heroImage: string | null
  slug: string
  airlineSlug: string
  airlineName: string
  fullTitle: string
  city: string
  country: string
  countryCode: string
  region: string
  address: string
  phone: string
  ctaPhone: string
  email: string
  workingHours: string
  workingDays: string
  website: string
  onlineCheckin?: string
  flightStatus?: string
  baggageInfo?: string
  isHeadquarters: boolean
  mapEmbedUrl?: string
  mapLat?: number
  mapLng?: number
  faqs: FAQ[]
  metaTitle: string
  metaDescription: string
  ogImage?: string | null
  canonicalUrl?: string
  noindex: boolean
  isFeatured?: boolean
  publishedAt: string
  updatedAt: string
  content: string             // Tiptap HTML — intro/overview/services/airport/fleet/map/conclusion all typed freely
  socialMedia: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
    linkedin?: string
  }
}

// ─── Blog ──────────────────────────────────────────────────────────────────

export interface BlogPostIndex {
  slug: string
  title: string
  excerpt: string
  featuredImage: string
  category: string
  author: string
  publishedAt: string
  updatedAt: string
  readingTime: string
}

export interface BlogFAQ {
  question: string
  answer: string
}

export interface BlogPost extends BlogPostIndex {
  content: string
  metaTitle: string
  metaDescription: string
  ogImage: string
  canonicalUrl?: string
  noindex: boolean
  faqs: BlogFAQ[]
  relatedPosts: string[]
  // author yahan define mat karo — BlogPostIndex se already inherit ho raha hai (author: string)
}

// ─── Sidebar ───────────────────────────────────────────────────────────────

export interface SidebarPopularPage {
  title: string
  url: string
  city: string
}

export interface SidebarData {
  popularPages: SidebarPopularPage[]
  topAirlines: { name: string; slug: string }[]
}

// ─── Meta ──────────────────────────────────────────────────────────────────

export interface Country {
  slug: string
  name: string
  isoCode: string
  region: string
}

export interface AirportMeta {
  iataCode: string
  name: string
  city: string
  country: string
} 