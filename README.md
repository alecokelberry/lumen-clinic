# Lumen Clinic

> White-label clinic platform — one Next.js app becomes the complete website, patient portal, and real-time appointment system for any medical clinic.

**Live demo:** https://lumen-clinic.vercel.app

---

## What it does

A single codebase that instantly becomes any clinic's full digital presence — fully branded with custom colors, logo, providers, services, and locations. Patients book appointments, manage their health, and message their care team without ever leaving the site.

### Public marketing site
- Hero with clinic photo, tagline, and Book Appointment CTA
- Services grid pulled from the database
- Provider photo grid with bios and "Book with Dr. X" links
- Multi-location support with hours and map coordinates

### Real-time appointment booking
- Self-service calendar showing **true availability** based on provider schedules
- Filter by provider, service, or location
- In-person or telehealth toggle
- Guest booking (no account required for a first appointment)
- Instant booking confirmation email via Resend
- Reschedule or cancel from the patient portal

### Patient portal
- Upcoming and past appointments dashboard
- Reschedule with real availability checking
- Cancellation with confirmation dialog
- Medical records, messages, billing, and settings stubs (ready to build out)

### Clinic admin dashboard
- Bookings list with status filter (scheduled / confirmed / completed / cancelled / no-show)
- Confirm or cancel appointments in one click
- Provider cards with upcoming and total booking counts
- Analytics overview: this month vs last month, booking breakdown, top services, no-show rate
- Role-based access (Clerk `publicMetadata.role = "admin"` required)

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
  book/                 # Multi-step booking wizard (5 steps)
  (portal)/             # Patient portal — dashboard, appointments, records, billing...
  (admin)/              # Clinic admin — bookings, providers, overview
  sign-in/ sign-up/     # Clerk auth pages

components/
  booking/              # Wizard step components
  admin/                # Admin-only components (filters, row actions, nav)
  portal/               # Portal nav
  shared/               # Shared layout components
  ui/                   # shadcn/ui primitives

lib/
  actions/              # Server actions (booking, appointments, availability)
  supabase/             # Supabase client helpers + types
  clinic.ts             # getClinic() — per-request tenant resolution
  email.ts              # Resend confirmation email
  require-admin.ts      # Admin role guard

supabase/
  migrations/
    001_initial_schema.sql   # All tables + RLS policies
    002_seed_demo_data.sql   # Lumen Clinic demo data

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

Fill in all values in `.env.local` (Clerk keys, Supabase URL + keys, Resend API key).

### 3. Database migrations

In your Supabase dashboard → SQL Editor, run the migrations **in order**:

1. `supabase/migrations/001_initial_schema.sql` — creates all tables + RLS policies
2. `supabase/migrations/002_seed_demo_data.sql` — seeds Lumen Clinic demo data

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
- **`createServiceClient()`** — Supabase client using the service role key (bypasses RLS). Used only in server actions and server components.
- **Clinic branding** — All branded colors use `var(--clinic-primary)` and `var(--clinic-accent)` CSS variables injected per tenant by `ClinicBrandProvider`.
- **Supabase types** — `lib/supabase/types.ts` is a handwritten stub. Run `npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts` to replace it with generated types and remove the `(supabase as any)` casts.
- **Availability** — Checked against `provider_schedules` (day_of_week + start/end time) minus existing non-cancelled appointments. Times are treated as UTC, which is correct on Vercel.

---

## Roadmap

### Done
- [x] Multi-tenant architecture with subdomain routing
- [x] Public marketing site (services, providers, locations from DB)
- [x] 5-step booking wizard with real availability checking
- [x] Guest booking (no login required)
- [x] Patient portal (dashboard, appointments, reschedule, cancel)
- [x] Clerk auth (sign-in, sign-up, portal guard)
- [x] Booking confirmation email (Resend)
- [x] Admin dashboard (bookings, stats, filters, confirm/cancel)
- [x] Admin providers page and analytics overview
- [x] Role-based admin access (Clerk publicMetadata)

### Phase 2
- [ ] SMS reminders (Twilio) — 24h and 1h before appointment
- [ ] Admin settings — edit clinic branding, colors, logo
- [ ] Provider schedule management in admin UI
- [ ] Digital intake forms with e-signatures
- [ ] Stripe bill pay
- [ ] Secure patient–provider messaging
- [ ] White-label onboarding wizard (new clinic in <10 min)
- [ ] Proper timezone support per location

---

## License

MIT
