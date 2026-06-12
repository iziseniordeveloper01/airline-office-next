// ─── Airline ───────────────────────────────────────────────────────────────

export interface AirlineIndex {
  slug: string
  name: string
  iataCode: string
  logo: string
  isFeatured: boolean
  officeCount: number
}

export interface Airline {
  slug: string
  name: string
  iataCode: string
  icaoCode: string
  logo: string
  coverImage?: string
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
  updatedAt: string
}

// ─── Office ────────────────────────────────────────────────────────────────

export interface FleetItem {
  aircraft: string
  inService: number
}

export interface FAQ {
  question: string
  answer: string
}

export interface AirportInfo {
  name: string
  code: string
  terminal: string
  address: string
  phone?: string
}

export interface Office {
  heroImage:string
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
  airport?: AirportInfo
  services: string[]
  fleet: FleetItem[]
  faqs: FAQ[]
  metaTitle: string
  metaDescription: string
  ogImage?: string
  isPublished: boolean
  isFeatured?: boolean
  publishedAt: string
  updatedAt: string
  content?: {                 // ← new block
    introP1?: string
    introP2?: string
    overviewDesc?: string
    servicesDesc?: string
    airportDesc?: string
    fleetDesc?: string
    mapDesc?: string
    conclusionDesc?: string
  }
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
  publishedAt: string
  readingTime: string
}

export interface BlogPost extends BlogPostIndex {
  content: string
  metaTitle: string
  metaDescription: string
  ogImage: string
  author?: string
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