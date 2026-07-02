# Airline Office Directory

A Next.js (App Router) directory site for browsing airline office locations, with a database-backed admin panel for managing airlines, offices, and blog content.

Built with Next.js 16, React 19, Tailwind CSS v4, Drizzle ORM + MySQL, and NextAuth for admin authentication.

## 1. Project Summary

- Public airline listing, airline detail, and office location pages
- Blog listing and article pages
- Admin panel for airlines, offices, blog posts, and user management (role-based: editor / admin / super_admin)
- Authentication via `next-auth` with a credentials provider backed by the `users` table
- Content stored in MySQL via Drizzle ORM (schema in `src/lib/schema.ts`)
- Images uploaded through the admin panel are optimized with `sharp` and stored as `MEDIUMBLOB` rows, served from `/api/images/[id]`
- Server Actions handle all admin create/update/delete flows and call `revalidatePath()` directly — no separate `/api/admin/*` or `/api/revalidate` routes

## 2. Folder Structure

- `src/app/` — routes (App Router)
  - `page.tsx` — homepage
  - `layout.tsx` — root layout
  - `[airlineSlug]/`, `[airlineSlug]/[officeSlug]/` — airline and office detail pages
  - `airlines/`, `headquarters/`, `blog/` — listing pages
  - `admin/` — admin panel pages and Server Actions (`actions.ts` per resource)
  - `api/auth/[...nextauth]/`, `api/images/[id]/` — auth route and image serving
- `src/components/` — `layout/`, `blog/`, `admin/` UI components
- `src/lib/` — `schema.ts` (Drizzle schema), `db.ts` (connection pool), `data/` (read helpers per resource), `auth/requireRole.ts`, `sanitize.ts`, `images.ts`, `slug.ts`
- `src/auth.ts` — NextAuth configuration (credentials provider)
- `src/proxy.ts` — Next.js 16 proxy (formerly `middleware.ts`) — gates `/admin/*` behind a session check
- `drizzle/` — generated SQL migrations
- `scripts/seed.ts` — creates the first `super_admin` user from `ADMIN_EMAIL`/`ADMIN_PASSWORD`

## 3. Required Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000

DATABASE_URL=mysql://user:password@localhost:3306/airline_directory

# Used once by scripts/seed.ts to create the first super_admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=change-me

AUTH_SECRET=your-random-auth-secret

# Optional — only needed if you wire up the scheduled-publish cron (see "Content
# workflow" below). Required to call /api/cron/publish-scheduled.
CRON_SECRET=another-random-secret
```

- `NEXT_PUBLIC_SITE_URL`: used for canonical URLs, sitemap generation, and `metadataBase`.
- `DATABASE_URL`: MySQL connection string (Drizzle/`mysql2`).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: only read by `scripts/seed.ts` to bootstrap the first super_admin; not used at request time.
- `AUTH_SECRET`: required by `next-auth` for session signing.
- `CRON_SECRET`: bearer token checked by `/api/cron/publish-scheduled`. Optional — see "Content workflow" below.

## 4. Setup and Installation

```bash
npm install

# generate the schema and apply it to your MySQL database
npx drizzle-kit generate
npx drizzle-kit migrate

# create the first super_admin user (reads ADMIN_EMAIL / ADMIN_PASSWORD from .env.local)
npx tsx scripts/seed.ts

npm run dev
```

Open `http://localhost:3000`.

## 5. Running the App

- `npm run dev` — start the development server
- `npm run build` — compile for production
- `npm run start` — serve the production build
- `npm run lint` — run ESLint

## 6. Admin and Authentication Flow

- Admin pages live under `/admin`. Login: `/admin/login`.
- `src/proxy.ts` redirects unauthenticated requests to `/admin/*` to the login page.
- Roles (`src/lib/schema.ts`, enforced via `src/lib/auth/requireRole.ts`):
  - `editor` — create/edit airlines, offices, and blog posts
  - `admin` — everything an editor can do, plus delete content and manage editor accounts
  - `super_admin` — everything an admin can do, plus manage admin accounts
- Every Server Action under `src/app/admin/*/actions.ts` calls `requireRole()` as its first line.

## 7. Content Workflow (Status, Scheduling, Trash)

`airlines`, `offices`, and `blog_posts` each have `status` (`draft` / `published` /
`scheduled`), `scheduledAt`, `deletedAt` (soft-delete), and SEO fields
(`metaTitle`/`metaDescription`/`ogImage`/`canonicalUrl`/`noindex`).

- **Visibility** is decided on-read by `isPubliclyVisible()` in
  `src/lib/visibility.ts` — a row is public when `status = 'published'` OR
  (`status = 'scheduled'` AND `scheduledAt <= now`). Every public query uses this
  helper, so a scheduled item becomes visible the instant its own URL is requested
  after `scheduledAt` passes — no cron required for correctness.
- **Slug** is locked (read-only) once a row is currently live (published, or
  scheduled-and-due) to avoid silently breaking an indexed public URL. It's only
  editable while still a draft or not-yet-due scheduled item.
- **Trash**: editors can soft-delete (trash) content; only admin/super_admin can
  restore or permanently delete. See `/admin/{airlines,offices,blog}/trash`.
- **Autosave**: drafts autosave straight to the row; a currently-live row's autosave
  is buffered in `draftData` instead of touching the live columns, so in-progress
  edits never clobber what's published. An explicit "Save Changes" merges it live.

### Optional cron: `/api/cron/publish-scheduled`

`GET` with `Authorization: Bearer $CRON_SECRET` flips any due `scheduled` rows to
`published` and revalidates every cached page. **Correctness never depends on this
running** — see "Visibility" above. What it *does* fix is **listing pages**: a
detail page renders correctly on-demand the moment it's requested, but cached
listing/index pages (blog index, an airline's office list, the homepage) only
refresh on their own ISR `revalidate` window (1h–24h, or never for the homepage,
which has none) unless something calls `revalidatePath`. Point an external
scheduler (cron-job.org, Hostinger's cron, etc.) at this route every few minutes if
you want scheduled posts to show up in listings promptly instead of waiting out
that window.

## 8. Data Management

All content lives in MySQL (see `src/lib/schema.ts` for the full schema):

- `airlines`, `offices`, `office_faqs` — core directory content
- `blog_posts`, `blog_faqs` — blog content
- `images` — uploaded images (optimized to WebP on upload, served from `/api/images/[id]`)
- `users` — admin accounts

Admin Server Actions write directly to the database and call `revalidatePath()` for the affected public routes.

## 9. Troubleshooting

- If `next dev` fails, confirm Node.js 20+ and npm are installed, and that `DATABASE_URL` points to a reachable MySQL instance with the schema migrated.
- If admin login fails, confirm a user exists (`npx tsx scripts/seed.ts`) and `AUTH_SECRET` is set.
- If styling does not render correctly, confirm `tailwindcss`, `@tailwindcss/postcss`, and `postcss.config.mjs` are present and unmodified.

---

For full customization, inspect the source under `src/app/`, `src/components/`, and `src/lib/`.
