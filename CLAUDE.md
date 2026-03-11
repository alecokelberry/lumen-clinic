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

## Key files
- `proxy.ts` — middleware: tenant slug resolution + Clerk auth
- `lib/clinic.ts` — `getClinic()` React-cached server fn, reads `x-clinic-slug` header
- `lib/supabase/types.ts` — handwritten DB type stub; run `npx supabase gen types typescript --project-id ezmktsrucdkzjrkpyigb > lib/supabase/types.ts` to replace with generated types and remove `(supabase as any)` casts
- `lib/supabase/server.ts` — `createClient()` (anon) + `createServiceClient()` (service role, bypasses RLS)
- `lib/actions/booking.ts` — creates appointments + sends confirmation email
- `lib/actions/appointments.ts` — cancel, confirm, reschedule
- `lib/actions/availability.ts` — `getAvailableDates` + `getAvailableSlots` against real provider schedules
- `lib/email.ts` — Resend confirmation email (gracefully no-ops if key not set)
- `lib/require-admin.ts` — admin role guard via Clerk `publicMetadata.role`

## Route structure
- `app/(marketing)/` — public pages (home, services, providers, locations)
- `app/book/` — 5-step booking wizard; fetches services + providers from DB server-side
- `app/(portal)/` — patient portal (Clerk-protected)
- `app/(admin)/` — clinic admin (Clerk-protected + `role: "admin"` required)
- `app/sign-in/`, `app/sign-up/` — Clerk auth pages

## Branding system
`ClinicBrandProvider` injects `--clinic-primary` and `--clinic-accent` CSS vars per tenant.
All branded UI uses `bg-[var(--clinic-primary)]`, `text-[var(--clinic-primary)]`, etc.

## Multi-tenancy
`proxy.ts` extracts the subdomain, sets `x-clinic-slug` header on every request.
`getClinic()` reads that header and queries Supabase for the matching clinic row.
Falls back to the `lumen` demo clinic when running locally.

## Supabase patterns
- Always use `createServiceClient()` in server actions and server components
- Use `(supabase as any)` for all write operations (insert/update/upsert) until types are generated
- Fixed UUIDs in seed data match the booking wizard's service/provider IDs:
  - Services: `10000000-0000-0000-0000-00000000000{1-6}`
  - Providers: `20000000-0000-0000-0000-00000000000{1-4}`
  - Location: `30000000-0000-0000-0000-000000000001`

## Availability system
Provider schedules are in `provider_schedules` table (day_of_week 0-6, start_time, end_time, slot_duration_min).
All 4 demo providers work Mon–Fri 09:00–17:00 with 30-min slots.
Times are treated as UTC — correct on Vercel deployments.

## Admin access
Set `publicMetadata = { "role": "admin" }` on a Clerk user to grant access to `/admin`.
Enforced at two layers: `proxy.ts` (edge, requires JWT template) and `AdminLayout` via `requireAdmin()`.

## Conventions
- Avoid `"use client"` unless the component truly needs interactivity — prefer RSCs
- `revalidatePath()` after every mutation to bust the cache
- Sonner `toast.success/error` for all user-facing feedback
- shadcn components in `components/ui/`, shared layouts in `components/shared/`
- Never use `npm run dev` — always `node node_modules/next/dist/bin/next dev --turbopack`
