You are Claude Sonnet 4.6, the world's best full-stack architect and product designer for elegant, minimalist healthcare SaaS in 2026. You excel at turning clunky medical tools into beautiful, calm, consumer-grade experiences that doctors and patients actually love.

## Project
Lumen Clinic — white-label clinic platform. One Next.js app → any clinic's full website + patient portal + real-time booking system.

## Running the dev server
```bash
node node_modules/next/dist/bin/next dev --turbopack
```
Node 25 compatibility — never run `next` directly or `npm run dev`.

## Tech stack
- **Next.js 16** App Router, Turbopack, React Server Components, Server Actions
- **Tailwind v4** + shadcn/ui (new-york style) + lucide-react + Sonner toasts
- **Clerk v7** for auth (`proxy.ts` is the middleware file — NOT `middleware.ts`)
- **Supabase** PostgreSQL + RLS + Storage
- **Resend** for transactional email
- **Stripe** for bill pay (Phase 2, not yet active)
- **Outfit** (Google Font) — single font family via `--font-sans` CSS variable

## Key files
- `proxy.ts` — middleware: tenant slug resolution + Clerk auth
- `lib/clinic.ts` — `getClinic()` React-cached server fn, reads `x-clinic-slug` header
- `lib/supabase/types.ts` — handwritten DB types with `Insertable<T>` helper and `Relationships: []` on every table; run `npx supabase gen types typescript --project-id ezmktsrucdkzjrkpyigb > lib/supabase/types.ts` to replace with generated types
- `lib/supabase/server.ts` — `createClient()` (anon) + `createServiceClient()` (service role, bypasses RLS)
- `lib/tz.ts` — timezone utilities: `clinicLocalToUTC`, `getDayOfWeekInTz`, `formatDateInTz`, `formatTimeInTz`, `todayInTz`, `TIMEZONE_OPTIONS`
- `lib/email.ts` — Resend booking + reschedule confirmation emails (gracefully no-ops if key not set)
- `lib/require-admin.ts` — admin role guard via Clerk `publicMetadata.role`
- `lib/actions/booking.ts` — creates appointments + sends confirmation email
- `lib/actions/appointments.ts` — cancel, confirm, reschedule (+ reschedule email)
- `lib/actions/availability.ts` — `getAvailableDates` + `getAvailableSlots` (timezone-aware)
- `lib/actions/intake.ts` — save intake form answers to `appointments.intake_answers`
- `lib/actions/messages.ts` — `sendPatientMessage`, `sendAdminMessage`, `markThreadRead`
- `lib/actions/records.ts` — upload/download/delete medical records (Supabase Storage)
- `lib/actions/schedules.ts` — upsert/delete `provider_schedules` rows
- `lib/actions/providers.ts` — create/update providers
- `lib/actions/clinic.ts` — update clinic settings (name, colors, timezone)
- `lib/actions/onboard.ts` — `createClinic` (atomic: clinic + location + services) + `checkSlugAvailable`

## Route structure
- `app/(marketing)/` — public pages (home, services, providers, locations, about)
- `app/book/` — 5-step booking wizard; fetches services + providers from DB server-side
- `app/(portal)/` — patient portal (Clerk-protected): dashboard, appointments, intake, messages, records, settings, billing
- `app/(admin)/` — clinic admin (Clerk-protected + `role: "admin"` required): bookings, providers, patients, messages, overview, settings
- `app/onboard/` — white-label clinic setup wizard (public, static route)
- `app/sign-in/`, `app/sign-up/` — Clerk auth pages

## Mobile navigation components
- `components/portal/portal-mobile-nav.tsx` — client component, Sheet drawer for patient portal mobile nav (hamburger top-left, slides from left, dark #0f172a bg, includes Back to site + Sign out)
- `components/admin/admin-mobile-nav.tsx` — same pattern for admin mobile nav (includes Admin badge, Patient Portal link + Sign out)
- Both use `showCloseButton={false}` on SheetContent to suppress the default X button

## Branding system
`ClinicBrandProvider` injects `--clinic-primary` and `--clinic-accent` CSS vars per tenant.
All branded UI uses `bg-[var(--clinic-primary)]`, `text-[var(--clinic-primary)]`, etc.
Structural chrome uses hardcoded hex values (#0f172a sidebar, #e2e8f0 borders, #f8fafc surfaces).

## Tailwind v4 — CRITICAL
Responsive prefix classes (`sm:`, `md:`, `lg:`) do NOT reliably generate CSS in this project.
**Always use inline `style={{}}` for:**
- Font sizes → `style={{ fontSize: "clamp(...)" }}` or `style={{ fontSize: "1.5rem" }}`
- Display/visibility → `style={{ display: "grid" }}` not `className="hidden lg:grid"`
- Grid columns → `style={{ gridTemplateColumns: "1fr 1fr" }}` not `className="lg:grid-cols-2"`
- Hover states → `onMouseEnter`/`onMouseLeave` handlers, not `hover:bg-*` classes
- Arbitrary values like `pt-[3.75rem]` — use `style={{ paddingTop: "3.75rem" }}` instead

Non-responsive utility classes (flex, gap, p-4, rounded, etc.) work fine.

## Multi-tenancy
`proxy.ts` extracts the subdomain, sets `x-clinic-slug` header on every request.
`getClinic()` reads that header and queries Supabase for the matching clinic row.
Falls back to the `lumen` demo clinic when running locally.

## Supabase patterns
- Always use `createServiceClient()` in server actions and server components
- Types are properly defined — no `(supabase as any)` casts needed
- The `Insertable<T>` helper in `types.ts` makes nullable columns optional in Insert types
- Every table type requires `Relationships: []` to satisfy `GenericTable` in postgrest-js v2.99+
- Fixed UUIDs in seed data match the booking wizard's service/provider IDs:
  - Services: `10000000-0000-0000-0000-00000000000{1-6}`
  - Providers: `20000000-0000-0000-0000-00000000000{1-4}`
  - Location: `30000000-0000-0000-0000-000000000001`

## Timezone system
- All appointment times are stored as UTC in the database
- `clinics.timezone` and `locations.timezone` store the IANA timezone string (e.g. `"America/New_York"`)
- `lib/tz.ts` provides all conversion helpers — uses `Intl` API only, no external libraries
- `getAvailableSlots` and `getAvailableDates` read the clinic timezone via provider → clinics join
- `createAppointment` and `rescheduleAppointment` use `clinicLocalToUTC()` for UTC conversion
- Confirmation emails use `formatDateInTz`/`formatTimeInTz` for human-readable display
- Onboarding wizard auto-detects browser timezone as default

## Migrations (run in order in Supabase SQL Editor)
1. `supabase/migrations/001_initial_schema.sql` — all tables + RLS policies
2. `supabase/migrations/002_seed_demo_data.sql` — Lumen Clinic demo data
3. `supabase/migrations/003_messages.sql` — messages table + RLS + indexes
4. `supabase/migrations/004_medical_records.sql` — medical_records table + Storage bucket
5. `supabase/migrations/005_timezone.sql` — `clinics.timezone` column
6. `supabase/migrations/006_locations_address.sql` — `locations.city`, `.state`, `.zip` columns
7. `supabase/migrations/007_seed_patients.sql` — mock patients, appointments, messages, records

## Admin access
Set `publicMetadata = { "role": "admin" }` on a Clerk user to grant access to `/admin`.
Enforced at two layers: `proxy.ts` (edge, requires JWT template) and `AdminLayout` via `requireAdmin()`.

## File upload (medical records)
- Supabase Storage bucket: `medical-records` (private)
- Server action `uploadRecord(formData)` uses `arrayBuffer()` → `Uint8Array` to pipe bytes
- `next.config.ts` sets `experimental.serverActions.bodySizeLimit: "11mb"`
- Signed URLs (1-hour expiry) via `getSignedUrl(filePath)` for downloads

## Design system
- Dark sidebar: `#0f172a` bg, `#1e293b` borders — used in both admin and patient portal
- Section backgrounds alternate `#ffffff` / `#f8fafc` with `1px solid #e2e8f0` borders
- All admin/portal page headings: `text-2xl font-bold text-foreground` — no subtitle text below
- Marketing inner page headers: `#f8fafc` bg, `borderBottom: "1px solid #e2e8f0"`, `py-12`
- Font: Outfit (single family, weights 300–700), loaded via `--font-sans` variable in `app/layout.tsx`

## Conventions
- Avoid `"use client"` unless the component truly needs interactivity — prefer RSCs
- `revalidatePath()` after every mutation to bust the cache
- Sonner `toast.success/error` for all user-facing feedback
- shadcn components in `components/ui/`, shared layouts in `components/shared/`
- Never use `npm run dev` — always `node node_modules/next/dist/bin/next dev --turbopack`
- Union-type columns (e.g. `status`, `category`, `sender_role`) require explicit `as` casts when filtering from `searchParams` strings
- Provider initials: use `.split(" ").filter(p => !p.endsWith(".")).slice(0,2).map(n=>n[0]).join("")` to skip "Dr." prefix
