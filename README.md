# Lumen Clinic

> White-label clinic platform — one Next.js app becomes the complete website, patient portal, and real-time appointment system for any medical clinic.

**Live demo:** https://lumen-clinic.vercel.app

---

## What it does

A single codebase that instantly becomes any clinic's full digital presence — fully branded with custom colors, providers, services, and locations. Patients book appointments, manage their health, and message their care team without ever leaving the site. Clinic admins manage everything from a single dashboard.

### Public marketing site
- Hero with clinic photo, tagline, and Book Appointment CTA
- Services grid pulled from the database
- Provider photo grid with bios and "Book with Dr. X" links
- Multi-location support with hours and map coordinates

### Real-time appointment booking
- Self-service calendar showing **true availability** based on provider schedules
- Filter by provider, service, or location
- In-person or telehealth toggle
- Guest booking (no account required)
- Instant booking confirmation email via Resend
- Reschedule or cancel from the patient portal

### Patient portal
- Upcoming and past appointments dashboard
- Reschedule with live availability checking
- Digital intake forms (visit reason, medications, allergies, emergency contact, insurance)
- Secure messaging with the clinic
- Medical records — upload, download, and organize documents by category
- Account settings via Clerk

### Clinic admin dashboard
- Bookings table with status filters (scheduled / confirmed / completed / cancelled / no-show)
- Confirm or cancel appointments in one click
- View intake answers per booking (slide-out panel)
- **Provider management** — add, edit, toggle active/inactive
- **Provider schedule editor** — per-day availability with slot duration control
- **Patient list** — searchable, with appointment counts; patient detail pages
- **Secure messaging** — inbox sorted by thread, unread counts, reply from admin
- **Analytics overview** — month-over-month bookings, breakdown by status, top services, no-show rate
- **Clinic settings** — name, tagline, brand colors, timezone
- Role-based access (`Clerk publicMetadata.role = "admin"` required)

### White-label onboarding
- 4-step wizard: clinic identity → branding → location + hours + timezone → services
- Slug availability check with live preview
- Auto-detects browser timezone as default
- Creates clinic, location, and services atomically

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, React Server Components) |
| UI | shadcn/ui (new-york) + Tailwind v4 + lucide-react + Sonner |
| Auth | Clerk v7 |
| Database | Supabase (PostgreSQL + RLS + Storage) |
| Email | Resend |
| Payments | Stripe _(Phase 2)_ |
| Deployment | Vercel |

---

## Project structure

```
app/
  (marketing)/          # Public site — home, services, providers, locations
  book/                 # 5-step booking wizard (guest or authenticated)
  (portal)/             # Patient portal — dashboard, appointments, intake,
  |                     #   messages, records, settings, billing
  (admin)/              # Clinic admin — bookings, providers, patients,
  |                     #   messages, overview, settings
  onboard/              # White-label onboarding wizard (new clinic setup)
  sign-in/ sign-up/     # Clerk auth pages

components/
  booking/              # Booking wizard step components
  admin/                # Admin-only components (filters, row actions, nav, intake viewer)
  portal/               # Portal nav + message composer
  shared/               # Shared layout components
  ui/                   # shadcn/ui primitives

lib/
  actions/              # Server actions:
  |   booking.ts        #   create appointment + confirmation email
  |   appointments.ts   #   cancel, confirm, reschedule + reschedule email
  |   availability.ts   #   getAvailableDates + getAvailableSlots (timezone-aware)
  |   intake.ts         #   save intake form answers
  |   messages.ts       #   send patient/admin messages, mark read
  |   records.ts        #   upload/download/delete medical records
  |   schedules.ts      #   upsert provider weekly schedules
  |   providers.ts      #   create/update providers
  |   clinic.ts         #   update clinic settings
  |   onboard.ts        #   createClinic + checkSlugAvailable
  supabase/
  |   server.ts         #   createClient() + createServiceClient()
  |   types.ts          #   handwritten DB types (Insertable<> helper, Relationships: [])
  clinic.ts             # getClinic() — per-request tenant resolution (React cache)
  email.ts              # Resend booking + reschedule confirmation emails
  tz.ts                 # Timezone utilities (clinicLocalToUTC, TIMEZONE_OPTIONS, ...)
  require-admin.ts      # Admin role guard via Clerk publicMetadata

supabase/
  migrations/
    001_initial_schema.sql        # All tables + RLS policies
    002_seed_demo_data.sql        # Lumen Clinic demo data (4 providers, 6 services)
    003_messages.sql              # messages table + RLS
    004_medical_records.sql       # medical_records table + Storage bucket
    005_timezone.sql              # clinics.timezone column
    006_locations_address.sql     # locations city/state/zip columns

proxy.ts                # Middleware — tenant slug resolution + Clerk auth
```

---

## Local setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Clerk](https://clerk.com) application
- A [Resend](https://resend.com) account _(optional — emails log to console without it)_

### 1. Clone and install

```bash
git clone https://github.com/your-username/lumen-clinic.git
cd lumen-clinic
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys |
| `CLERK_SECRET_KEY` | Clerk → API Keys |
| `RESEND_API_KEY` | Resend → API Keys _(optional)_ |

### 3. Database migrations

In your Supabase dashboard → SQL Editor, run the migrations **in order**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_seed_demo_data.sql`
3. `supabase/migrations/003_messages.sql`
4. `supabase/migrations/004_medical_records.sql`
5. `supabase/migrations/005_timezone.sql`
6. `supabase/migrations/006_locations_address.sql`

### 4. Run the dev server

```bash
# Must use node directly — Next.js 16 + Node 25 compatibility
node node_modules/next/dist/bin/next dev --turbopack
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

### 1. Push to GitHub, then import in Vercel

In the Vercel dashboard → New Project → import your repo.

### 2. Add environment variables

Copy every key from `.env.example` into Vercel's Environment Variables panel with your real values. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL.

### 3. Deploy

Vercel auto-detects Next.js. The build command is `next build` (standard). No changes needed.

### 4. Multi-tenant subdomain routing (optional)

If you want `clinic.lumenclinic.health` to resolve to a specific clinic:

1. Add your domain in Vercel → Domains
2. Add a wildcard DNS record: `*.lumenclinic.health → CNAME → cname.vercel-dns.com`
3. Set `NEXT_PUBLIC_ROOT_DOMAIN=lumenclinic.health` in Vercel env vars
4. `proxy.ts` extracts the subdomain and sets `x-clinic-slug` on every request

For localhost development, the app defaults to the `lumen` clinic slug.

---

## Admin access

Any logged-in Clerk user who visits `/admin` will be redirected to `/dashboard` unless they have the admin role set.

To grant admin access:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Users → select the user
2. Scroll to **Metadata → Public metadata** → set:
   ```json
   { "role": "admin" }
   ```
3. Save and re-login.

**Optional — faster edge enforcement:** In Clerk Dashboard → JWT Templates → Default, add `"metadata": "{{user.public_metadata}}"` to include the role in the JWT. This enables the middleware to redirect before the page renders.

---

## Key conventions

- **`getClinic()`** — React-cached server function, reads `x-clinic-slug` header set by `proxy.ts`. Falls back to the `lumen` demo clinic locally.
- **`createServiceClient()`** — Supabase client using the service role key (bypasses RLS). Used in all server actions and server components.
- **Clinic branding** — All branded colors use `var(--clinic-primary)` and `var(--clinic-accent)` CSS variables injected per tenant by `ClinicBrandProvider`.
- **Supabase types** — `lib/supabase/types.ts` is a handwritten stub with a custom `Insertable<T>` helper that makes nullable columns optional (mirrors Supabase code-gen behavior). Run `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts` to replace with fully generated types.
- **Timezone** — All appointment times are stored as UTC. Display and availability logic use `lib/tz.ts` helpers (`clinicLocalToUTC`, `formatDateInTz`, etc.) with the clinic's `timezone` column.
- **Availability** — Checked against `provider_schedules` (day_of_week + start/end time in clinic timezone) minus existing non-cancelled appointments.

---

## Roadmap

### Done ✓
- [x] Multi-tenant architecture with subdomain routing
- [x] Public marketing site (services, providers, locations from DB)
- [x] 5-step booking wizard with real timezone-aware availability checking
- [x] Guest booking (no login required)
- [x] Patient portal — dashboard, appointments, reschedule, cancel
- [x] Digital intake forms
- [x] Secure patient–clinic messaging
- [x] Medical records upload/download (Supabase Storage)
- [x] Clerk auth (sign-in, sign-up, portal guard)
- [x] Booking + reschedule confirmation emails (Resend)
- [x] Admin — bookings, confirm/cancel, intake viewer
- [x] Admin — provider add/edit + schedule management
- [x] Admin — patient list + detail pages
- [x] Admin — secure messaging inbox
- [x] Admin — analytics overview (KPIs, breakdown, top services)
- [x] Admin — clinic settings (branding, timezone)
- [x] White-label onboarding wizard
- [x] Full timezone support per clinic location
- [x] Proper Supabase TypeScript types (no `any` casts)
- [x] Role-based admin access (Clerk publicMetadata)

### Phase 2
- [ ] SMS reminders (Twilio) — 24h and 1h before appointment
- [ ] Vercel cron job for reminder scheduling
- [ ] Stripe bill pay
- [ ] Real-time messaging (Supabase Realtime)
- [ ] Provider photo upload

---

## License

MIT
