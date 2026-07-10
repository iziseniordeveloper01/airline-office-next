import { relations } from 'drizzle-orm'
import {
  mysqlTable, int, varchar, text, longtext,
  boolean, decimal, timestamp, datetime, customType, uniqueIndex, index, mysqlEnum,
  primaryKey,
} from 'drizzle-orm/mysql-core'

// MEDIUMBLOB — Drizzle has no native blob builder, customType is the official approach
const mediumblob = customType<{ data: Buffer }>({
  dataType() { return 'mediumblob' },
})

// ── IMAGES ──────────────────────────────────────────────────────────
export const images = mysqlTable('images', {
  id:         varchar('id', { length: 36 }).primaryKey(),       // UUID
  filename:   varchar('filename', { length: 255 }),
  mimeType:   varchar('mime_type', { length: 50 }).notNull(),
  data:       mediumblob('data').notNull(),
  width:      int('width'),
  height:     int('height'),
  createdAt:  timestamp('created_at').defaultNow(),
})

// ── AUTH (Better Auth — managed via `npx auth generate`, hand-edit with care) ──
// Roles: super_admin > admin > editor (see src/lib/auth/permissions.ts)
// super_admin  → full access including creating/deleting admin users
// admin        → create editors, manage all content, cannot touch super_admin accounts
// editor       → create & edit offices/airlines/blog, cannot delete, cannot manage users
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { fsp: 3 }),
})

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  // defaultNow() is a DDL-only safety net — Better Auth always supplies the real
  // expiry on insert. Without SOME default, MariaDB (explicit_defaults_for_timestamp=0,
  // NO_ZERO_DATE) rejects a bare NOT NULL timestamp column at CREATE TABLE time.
  expiresAt: timestamp('expires_at', { fsp: 3 }).defaultNow().notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
}, (table) => [index('sessions_userId_idx').on(table.userId)])

export const accounts = mysqlTable('accounts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { fsp: 3 }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { fsp: 3 }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [index('accounts_userId_idx').on(table.userId)])

export const verifications = mysqlTable('verifications', {
  id: varchar('id', { length: 36 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { fsp: 3 }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => [index('verifications_identifier_idx').on(table.identifier)])

// ── AIRLINES ─────────────────────────────────────────────────────────
export const airlines = mysqlTable('airlines', {
  id:          int('id').autoincrement().primaryKey(),
  slug:        varchar('slug', { length: 100 }).notNull().unique(),
  name:        varchar('name', { length: 150 }).notNull(),
  iataCode:    varchar('iata_code', { length: 3 }),
  icaoCode:    varchar('icao_code', { length: 4 }),
  logoImageId: varchar('logo_image_id', { length: 36 }).references(() => images.id),
  coverImageId: varchar('cover_image_id', { length: 36 }).references(() => images.id),
  description: longtext('description'),        // Tiptap HTML
  website:     varchar('website', { length: 255 }),
  email:       varchar('email', { length: 150 }),
  phone:       varchar('phone', { length: 50 }),
  foundedYear: int('founded_year'),
  alliance:    varchar('alliance', { length: 100 }),
  hqAddress:   varchar('hq_address', { length: 255 }),
  hqPhone:     varchar('hq_phone', { length: 50 }),
  hqEmail:     varchar('hq_email', { length: 150 }),
  facebook:    varchar('facebook', { length: 255 }),
  twitter:     varchar('twitter', { length: 255 }),
  instagram:   varchar('instagram', { length: 255 }),
  youtube:     varchar('youtube', { length: 255 }),
  isFeatured:  boolean('is_featured').default(false),
  ogImageId:       varchar('og_image_id', { length: 36 }).references(() => images.id),
  metaTitle:       varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  canonicalUrl:    varchar('canonical_url', { length: 255 }),
  noindex:         boolean('noindex').default(false),
  status:      mysqlEnum('status', ['draft', 'published', 'scheduled']).default('draft').notNull(),
  // datetime, not timestamp — a nullable TIMESTAMP added via ALTER TABLE (when it isn't the
  // table's "first" timestamp column) gets an implicit NOT NULL DEFAULT '0000-00-00 00:00:00'
  // under explicit_defaults_for_timestamp=0, which NO_ZERO_DATE then rejects outright.
  publishedAt: datetime('published_at'),
  scheduledAt: datetime('scheduled_at'),
  deletedAt:   datetime('deleted_at'),
  draftData:     longtext('draft_data'),     // autosave buffer while status is currently live — see src/lib/visibility.ts isCurrentlyLive
  draftSavedAt:  datetime('draft_saved_at'),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow().onUpdateNow(),
  updatedBy:   varchar('updated_by', { length: 36 }).references(() => users.id),
}, (table) => ({
  statusIdx: index('airlines_status_idx').on(table.status),
  deletedAtIdx: index('airlines_deleted_at_idx').on(table.deletedAt),
  scheduledAtIdx: index('airlines_scheduled_at_idx').on(table.scheduledAt),
}))

// ── OFFICES ───────────────────────────────────────────────────────────
// content = single Tiptap HTML field containing:
// intro, overview, services table, airport details, fleet table, map desc, conclusion
// Everything the team types freely — no separate structured sub-fields
export const offices = mysqlTable('offices', {
  id:            int('id').autoincrement().primaryKey(),
  slug:          varchar('slug', { length: 150 }).notNull(),
  airlineId:     int('airline_id').notNull().references(() => airlines.id, { onDelete: 'cascade' }),
  fullTitle:     varchar('full_title', { length: 255 }).notNull(),

  // Structured — UI components depend on these (map, click-to-call, schema.org markup)
  city:          varchar('city', { length: 100 }).notNull(),
  country:       varchar('country', { length: 100 }).notNull(),
  countryCode:   varchar('country_code', { length: 2 }),
  region:        varchar('region', { length: 50 }),
  address:       varchar('address', { length: 255 }),
  mapEmbedUrl:   text('map_embed_url'),
  mapLat:        decimal('map_lat', { precision: 10, scale: 7 }),
  mapLng:        decimal('map_lng', { precision: 10, scale: 7 }),
  phone:         varchar('phone', { length: 50 }),
  ctaPhone:      varchar('cta_phone', { length: 50 }),
  email:         varchar('email', { length: 150 }),
  workingHours:  varchar('working_hours', { length: 100 }),
  workingDays:   varchar('working_days', { length: 100 }),
  website:       varchar('website', { length: 255 }),
  onlineCheckin: varchar('online_checkin', { length: 255 }),
  flightStatus:  varchar('flight_status', { length: 255 }),
  baggageInfo:   varchar('baggage_info', { length: 255 }),
  isHeadquarters: boolean('is_headquarters').default(false),

  heroImageId:   varchar('hero_image_id', { length: 36 }).references(() => images.id),
  ogImageId:     varchar('og_image_id', { length: 36 }).references(() => images.id),

  facebook:    varchar('facebook', { length: 255 }),
  twitter:     varchar('twitter', { length: 255 }),
  instagram:   varchar('instagram', { length: 255 }),
  youtube:     varchar('youtube', { length: 255 }),
  linkedin:    varchar('linkedin', { length: 255 }),

  // Free-form content (intro/overview/services/airport/fleet/map desc/conclusion all here)
  content:       longtext('content'),

  metaTitle:        varchar('meta_title', { length: 255 }),
  metaDescription:  varchar('meta_description', { length: 500 }),
  canonicalUrl:     varchar('canonical_url', { length: 255 }),
  noindex:          boolean('noindex').default(false),
  status:        mysqlEnum('status', ['draft', 'published', 'scheduled']).default('draft').notNull(),
  isFeatured:    boolean('is_featured').default(false),
  publishedAt:   timestamp('published_at'), // pre-existing column — left as timestamp, unchanged
  scheduledAt:   datetime('scheduled_at'),  // see airlines.publishedAt comment re: datetime vs timestamp
  deletedAt:     datetime('deleted_at'),
  draftData:     longtext('draft_data'),     // autosave buffer while status is currently live — see src/lib/visibility.ts isCurrentlyLive
  draftSavedAt:  datetime('draft_saved_at'),
  updatedAt:     timestamp('updated_at').defaultNow().onUpdateNow(),
  updatedBy:     varchar('updated_by', { length: 36 }).references(() => users.id),
}, (table) => ({
  airlineSlugIdx: uniqueIndex('airline_slug_idx').on(table.airlineId, table.slug),
  statusIdx: index('offices_status_idx').on(table.status),
  deletedAtIdx: index('offices_deleted_at_idx').on(table.deletedAt),
  scheduledAtIdx: index('offices_scheduled_at_idx').on(table.scheduledAt),
}))

// ── OFFICE FAQS ───────────────────────────────────────────────────────
// Structured intentionally — needed for Google FAQPage rich snippet JSON-LD
export const officeFaqs = mysqlTable('office_faqs', {
  id:        int('id').autoincrement().primaryKey(),
  officeId:  int('office_id').notNull().references(() => offices.id, { onDelete: 'cascade' }),
  question:  varchar('question', { length: 255 }).notNull(),
  answer:    text('answer').notNull(),
  sortOrder: int('sort_order').default(0),
})

// ── BLOG POSTS ────────────────────────────────────────────────────────
// ── BLOG CATEGORIES ───────────────────────────────────────────────────
// WordPress-style taxonomy. One primary category per post (categoryId FK on
// blog_posts); the legacy blog_posts.category varchar is kept as a denormalized
// display-name copy so existing public/admin reads keep working without joins —
// renameBlogCategory syncs it.
export const blogCategories = mysqlTable('blog_categories', {
  id:          int('id').autoincrement().primaryKey(),
  name:        varchar('name', { length: 100 }).notNull(),
  slug:        varchar('slug', { length: 120 }).notNull().unique(),
  description: varchar('description', { length: 500 }),
  createdAt:   timestamp('created_at').defaultNow(),
})

// ── BLOG TAGS ─────────────────────────────────────────────────────────
// Free-form, many-to-many (WP-style). Tags are auto-created on post save.
export const blogTags = mysqlTable('blog_tags', {
  id:        int('id').autoincrement().primaryKey(),
  name:      varchar('name', { length: 100 }).notNull(),
  slug:      varchar('slug', { length: 120 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const blogPostTags = mysqlTable('blog_post_tags', {
  postId: int('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  tagId:  int('tag_id').notNull().references(() => blogTags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.tagId] }),
  tagIdx: index('blog_post_tags_tag_idx').on(table.tagId),
}))

export const blogPosts = mysqlTable('blog_posts', {
  id:              int('id').autoincrement().primaryKey(),
  slug:            varchar('slug', { length: 150 }).notNull().unique(),
  title:           varchar('title', { length: 255 }).notNull(),
  excerpt:         text('excerpt'),
  // Denormalized category NAME (see blogCategories comment above). Kept in sync
  // with categoryId on every save/rename; public pages read this directly.
  category:        varchar('category', { length: 100 }),
  categoryId:      int('category_id').references(() => blogCategories.id, { onDelete: 'set null' }),
  content:         longtext('content'),         // Tiptap HTML
  heroImageId:     varchar('hero_image_id', { length: 36 }).references(() => images.id),
  ogImageId:       varchar('og_image_id', { length: 36 }).references(() => images.id),
  author:          varchar('author', { length: 100 }),
  // MariaDB's JSON type is just LONGTEXT under the hood — the driver won't
  // auto-parse it, so we store/parse this as a JSON string manually instead
  // of using Drizzle's json() column type.
  relatedPosts:    text('related_posts'),
  metaTitle:       varchar('meta_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  canonicalUrl:    varchar('canonical_url', { length: 255 }),
  noindex:         boolean('noindex').default(false),
  readingTime:     varchar('reading_time', { length: 20 }),
  status:          mysqlEnum('status', ['draft', 'published', 'scheduled']).default('draft').notNull(),
  publishedAt:     timestamp('published_at'), // pre-existing column — left as timestamp, unchanged
  scheduledAt:     datetime('scheduled_at'),   // see airlines.publishedAt comment re: datetime vs timestamp
  deletedAt:       datetime('deleted_at'),
  draftData:       longtext('draft_data'),     // autosave buffer while status is currently live — see src/lib/visibility.ts isCurrentlyLive
  draftSavedAt:    datetime('draft_saved_at'),
  updatedAt:       timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  statusIdx: index('blog_posts_status_idx').on(table.status),
  deletedAtIdx: index('blog_posts_deleted_at_idx').on(table.deletedAt),
  scheduledAtIdx: index('blog_posts_scheduled_at_idx').on(table.scheduledAt),
}))

// ── BLOG FAQS ─────────────────────────────────────────────────────────
export const blogFaqs = mysqlTable('blog_faqs', {
  id:        int('id').autoincrement().primaryKey(),
  postId:    int('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  question:  varchar('question', { length: 255 }).notNull(),
  answer:    text('answer').notNull(),
  sortOrder: int('sort_order').default(0),
})

// ── SITE SETTINGS ─────────────────────────────────────────────────────
// Simple key/value store (WordPress wp_options style). The admin UI writes a
// fixed, known set of keys; typed access + defaults live in
// src/lib/data/getSettings.ts. Keys use the SiteSettings field names directly.
export const settings = mysqlTable('settings', {
  key:       varchar('key', { length: 100 }).primaryKey(),
  value:     text('value'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  updatedBy: varchar('updated_by', { length: 36 }).references(() => users.id),
})

// ── REDIRECTS ─────────────────────────────────────────────────────────
// Recorded whenever a live airline/office/blog slug changes, so an old public
// URL 308s to its new location instead of 404ing (see src/lib/redirects.ts).
// Paths are globally unambiguous (/blog/x vs /airline vs /airline/office), so
// one fromPath -> toPath row covers all three entity types without a type column.
export const redirects = mysqlTable('redirects', {
  id:        int('id').autoincrement().primaryKey(),
  fromPath:  varchar('from_path', { length: 300 }).notNull().unique(),
  toPath:    varchar('to_path', { length: 300 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── ACTIVITY LOG ──────────────────────────────────────────────────────
// Append-only audit trail for admin mutations. userName is a denormalized
// snapshot so entries stay readable after a user is renamed or deleted
// (userId FK is SET NULL on delete). entityId is stored as text since content
// tables use int PKs while users/images use UUIDs.
export const activityLog = mysqlTable('activity_log', {
  id:          int('id').autoincrement().primaryKey(),
  userId:      varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  userName:    varchar('user_name', { length: 255 }),
  action:      varchar('action', { length: 30 }).notNull(),      // created | updated | trashed | restored | deleted | published | unpublished
  entityType:  varchar('entity_type', { length: 20 }).notNull(), // office | airline | blog | user | settings | media
  entityId:    varchar('entity_id', { length: 64 }),
  entityTitle: varchar('entity_title', { length: 255 }),
  href:        varchar('href', { length: 255 }),
  createdAt:   timestamp('created_at').defaultNow(),
}, (table) => ({
  createdAtIdx: index('activity_log_created_at_idx').on(table.createdAt),
  entityIdx:    index('activity_log_entity_idx').on(table.entityType, table.entityId),
  userIdx:      index('activity_log_user_idx').on(table.userId),
}))

// ── RELATIONS ─────────────────────────────────────────────────────────
export const airlinesRelations = relations(airlines, ({ many, one }) => ({
  offices: many(offices),
  logo:    one(images, { fields: [airlines.logoImageId], references: [images.id] }),
  cover:   one(images, { fields: [airlines.coverImageId], references: [images.id] }),
}))

export const officesRelations = relations(offices, ({ one, many }) => ({
  airline:       one(airlines, { fields: [offices.airlineId], references: [airlines.id] }),
  heroImage:     one(images,   { fields: [offices.heroImageId], references: [images.id] }),
  ogImage:       one(images,   { fields: [offices.ogImageId],   references: [images.id] }),
  faqs:          many(officeFaqs),
  updatedByUser: one(users,    { fields: [offices.updatedBy],   references: [users.id] }),
}))

export const officeFaqsRelations = relations(officeFaqs, ({ one }) => ({
  office: one(offices, { fields: [officeFaqs.officeId], references: [offices.id] }),
}))

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  heroImage: one(images, { fields: [blogPosts.heroImageId], references: [images.id] }),
  ogImage:   one(images, { fields: [blogPosts.ogImageId],   references: [images.id] }),
  faqs:      many(blogFaqs),
}))

export const blogFaqsRelations = relations(blogFaqs, ({ one }) => ({
  post: one(blogPosts, { fields: [blogFaqs.postId], references: [blogPosts.id] }),
}))

export const usersRelations = relations(users, ({ many }) => ({
  officesUpdated: many(offices),
  sessions: many(sessions),
  accounts: many(accounts),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))
