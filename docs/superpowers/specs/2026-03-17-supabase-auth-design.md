# Supabase Auth Migration Design

**Date:** 2026-03-17
**Status:** Approved
**Scope:** Replace Clerk v7 with Supabase Auth across the entire Lumen Clinic app

---

## Problem

`@clerk/nextjs` fails under Turbopack with a `useSession can only be used within <ClerkProvider />` error. The root cause is that Turbopack does not correctly bundle dynamically-imported React context providers — Clerk's client context never reaches the client bundle. Rather than patch around this limitation, we are replacing Clerk entirely with Supabase Auth, which has no client-side provider requirement (it uses cookies via `@supabase/ssr`).

---

## Goal

Migrate all authentication from Clerk v7 to Supabase Auth. After this migration:
- Users sign in / sign up via a Supabase-powered `<Auth>` component (email+password and magic link)
- Sessions are cookie-based and accessible server-side via `@supabase/ssr`
- Admin access is gated by `app_metadata.role === "admin"` in Supabase
- No Clerk packages remain in the codebase

---

## Auth Methods

- **Email + Password** — standard credential sign-in
- **Magic Link** — passwordless email link (OTP flow)

Both handled by `@supabase/auth-ui-react`'s `<Auth>` component with no OAuth providers.

---

## Architecture

### Packages

**Remove:**
- `@clerk/nextjs`

**Add:**
- `@supabase/auth-ui-react` — pre-built sign-in/sign-up UI
- `@supabase/auth-ui-shared` — theme tokens for the auth UI

> Note: `@supabase/ssr` is already in the project (`lib/supabase/server.ts`). Only the two auth UI packages are new installs.

### Session Helpers — `lib/supabase/auth.ts`

New file. Provides three server-side helpers used by Server Components and Server Actions.

```ts
// Returns the Supabase user or null (no throws)
export async function getUser(): Promise<User | null>

// Returns user or redirects to /sign-in
export async function requireUser(): Promise<User>

// Returns user only if app_metadata.role === "admin"
// Authenticated non-admin → redirect to /dashboard
// Unauthenticated → redirect to /sign-in?redirect_url=%2Fadmin
export async function requireAdmin(): Promise<User>
```

`getUser()` calls the existing `createClient()` from `lib/supabase/server.ts` (already uses `@supabase/ssr` with the `cookies()` adapter) then calls `supabase.auth.getUser()`.

### Middleware — `proxy.ts`

Replace the `clerkMiddleware` block with `@supabase/ssr` session refresh. The middleware **must** use a dedicated Supabase client constructed from the `request`/`response` cookie adapter — not `createClient()` from `lib/supabase/server.ts`, which uses `cookies()` from `next/headers` and is unavailable in middleware.

```ts
import { createServerClient } from "@supabase/ssr"

function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )
}
```

The new middleware logic:

1. Create a mutable `response = NextResponse.next({ request })` before calling Supabase
2. Call `supabase.auth.getUser()` — refreshes the session cookie onto `response`
3. Protected paths: `/dashboard`, `/appointments`, `/messages`, `/records`, `/billing`, `/forms`, `/settings`, `/admin`
4. Unauthenticated access to portal paths → redirect to `/sign-in?redirect_url=<pathname>`
5. Unauthenticated access to `/admin` → redirect to `/sign-in?redirect_url=%2Fadmin`
6. Authenticated non-admin access to `/admin` → redirect to `/dashboard`
7. Continue with existing tenant slug resolution (`x-clinic-slug` header logic — unchanged)
8. Always `return response` (not `NextResponse.next()`) so refreshed session cookies are written

### Sign-In / Sign-Up Pages

Replace Clerk `<SignIn>` / `<SignUp>` with `@supabase/auth-ui-react` `<Auth>` component.

- **Route:** `app/sign-in/page.tsx` (flat — `[[...sign-in]]` catchall directory deleted)
- **Route:** `app/sign-up/page.tsx` (flat — `[[...sign-up]]` catchall directory deleted)
- Both are Server Components that fetch `clinic.primary_color` via `getClinic()`, then pass it as a string prop to a `"use client"` wrapper that renders `<Auth>`
- The `<Auth>` component uses `ThemeSupa` with `variables.default.brand_button_background` set to the clinic's primary color hex string — `@supabase/auth-ui-shared` accepts only static hex tokens, not CSS variables
- `view="sign_in"` / `view="sign_up"` controls which form is shown
- `redirectTo` set to `${origin}/auth/callback` for magic link / OTP

**Note on user profile data:** For email+password and magic link sign-ups, `user.user_metadata.full_name` is undefined by default. Enable the "Full Name" field in the `<Auth>` sign-up form via `additionalData={{ full_name: true }}`, or fall back gracefully in the dashboard greeting to `user.email.split("@")[0]`.

**Note on patient record creation:** The sign-up page does not create a `patients` row. Patient records are created lazily via the `upsert` in `lib/actions/booking.ts` when the user completes their first booking. Users who sign up before booking will have no `patients` row — this matches the existing behavior.

### Auth Callback Route — `app/auth/callback/route.ts`

New Route Handler. Exchanges the `code` query param for a session after magic link / OTP clicks, then redirects to the intended destination.

Route Handlers can write cookies via the `NextResponse` object. Use `createServerClient` with a `NextResponse`-backed cookie adapter (the same pattern as middleware):

```ts
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const redirectTo = searchParams.get("redirect_url") ?? "/dashboard"

  const response = NextResponse.redirect(`${origin}${redirectTo}`)

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },  // request is NextRequest
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }
  return response
}
```

> The Supabase project's "Redirect URL" allowlist must include:
> - `http://localhost:3000/auth/callback` (magic link + sign-up OTP)
> - `http://localhost:3000/auth/callback` is also used for password reset (type=recovery) — no separate entry needed for localhost

### Database Changes

All database changes are delivered as a new migration file: **`supabase/migrations/008_supabase_auth_rls.sql`**

This is the complete migration:

```sql
-- 1. Rename column
ALTER TABLE public.patients RENAME COLUMN clerk_user_id TO user_id;

-- 2. Rename unique constraint (verify exact name first with: \d public.patients)
ALTER TABLE public.patients
  RENAME CONSTRAINT patients_clinic_id_clerk_user_id_key
  TO patients_clinic_id_user_id_key;

-- 3. Fix patients RLS policy (Clerk: auth.jwt() ->> 'sub'; Supabase: auth.uid()::text)
DROP POLICY IF EXISTS "patients: own record" ON public.patients;
CREATE POLICY "patients: own record" ON public.patients
  FOR ALL USING (auth.uid()::text = user_id);

-- 4. Fix appointments RLS policy
DROP POLICY IF EXISTS "appointments: own patient" ON public.appointments;
CREATE POLICY "appointments: own patient" ON public.appointments
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth.uid()::text = user_id
    )
  );

-- 5. Fix messages RLS policy
DROP POLICY IF EXISTS "messages: own patient read" ON public.messages;
CREATE POLICY "messages: own patient read" ON public.messages
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth.uid()::text = user_id
    )
  );

-- 6. Fix medical_records RLS policy
DROP POLICY IF EXISTS "records: own patient read" ON public.medical_records;
CREATE POLICY "records: own patient read" ON public.medical_records
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE auth.uid()::text = user_id
    )
  );
```

**TypeScript types:** In `lib/supabase/types.ts`, rename `clerk_user_id: string` → `user_id: string` on the `patients` Row/Insert/Update types. After this change, run `npx tsc --noEmit` — TypeScript will surface any remaining call sites referencing `clerk_user_id` (including the `booking.ts` payload field and `.eq()` filters in `messages.ts` and `records.ts`).

**Seed file update:** `supabase/migrations/007_seed_patients.sql` inserts into `clerk_user_id` by column name — update to `user_id` for fresh environment compatibility.

**Migration files to update for fresh environments** (these define the column name; a fresh `supabase db reset` applies them in order):
- `001_initial_schema.sql` — column definition + constraint + 2 RLS policies
- `003_messages.sql` — 1 RLS policy
- `004_medical_records.sql` — 1 RLS policy
- `007_seed_patients.sql` — insert data

> For a live database, apply `008_supabase_auth_rls.sql` instead of editing the older migrations.

### Nav Components — Sign-Out

All four nav components (`portal-nav`, `portal-mobile-nav`, `admin-nav`, `admin-mobile-nav`) use Clerk's `<SignOutButton>`. Replace with a shared client component:

**`components/shared/sign-out-button.tsx`** (new `"use client"` component):
```tsx
"use client"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export function SignOutButton({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const router = useRouter()
  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push("/sign-in")
  }
  return <button onClick={handleSignOut} className={className} style={style}>{children}</button>
}
```

Callers apply their own styling via `className` / `style` — identical to the current pattern where styles are on the Clerk `<SignOutButton>` wrapper's inner button.

Remove all `clerkConfigured` props that are threaded from layouts into nav components.

---

## File Inventory

### Files to Delete
- `components/clerk-provider.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx` (directory)
- `app/sign-up/[[...sign-up]]/page.tsx` (directory)

### Files to Create
- `lib/supabase/auth.ts` — `getUser`, `requireUser`, `requireAdmin`
- `app/auth/callback/route.ts` — magic link / OTP code exchange
- `app/sign-in/page.tsx` — Supabase `<Auth view="sign_in">`
- `app/sign-up/page.tsx` — Supabase `<Auth view="sign_up">`
- `components/shared/sign-out-button.tsx` — shared client sign-out
- `supabase/migrations/008_supabase_auth_rls.sql` — column rename + RLS policy updates

### Files to Modify

**Infrastructure:**
- `package.json` — remove `@clerk/nextjs`, add `@supabase/auth-ui-react` and `@supabase/auth-ui-shared`
- `proxy.ts` — replace `clerkMiddleware` block with middleware-pattern Supabase client + session check
- `app/layout.tsx` — remove `ClerkProviderWrapper` import and `clerkConfigured` flag
- `app/page.tsx` — remove `clerkConfigured` flag; both cards link directly to `/sign-in` and `/sign-in?redirect_url=%2Fadmin`
- `lib/require-admin.ts` — rewrite using `requireAdmin()` from `lib/supabase/auth.ts`
- `lib/supabase/types.ts` — rename `clerk_user_id` → `user_id` on patients types

**Migration files (for fresh env compatibility):**
- `supabase/migrations/001_initial_schema.sql` — column definition + constraint + 2 RLS policies
- `supabase/migrations/003_messages.sql` — 1 RLS policy
- `supabase/migrations/004_medical_records.sql` — 1 RLS policy
- `supabase/migrations/007_seed_patients.sql` — insert column name

**Portal layout and pages** (replace `auth()` / `currentUser()` with `requireUser()`; remove `clerkConfigured` prop):
- `app/(portal)/layout.tsx` — replace auth guard + remove `clerkConfigured` prop passed to nav
- `app/(portal)/dashboard/page.tsx` — replace `auth()` + `currentUser()`; derive greeting from `user.user_metadata?.full_name ?? user.email?.split("@")[0]`
- `app/(portal)/appointments/page.tsx`
- `app/(portal)/appointments/[id]/reschedule/page.tsx`
- `app/(portal)/appointments/[id]/intake/page.tsx`
- `app/(portal)/messages/page.tsx`
- `app/(portal)/records/page.tsx`
- `app/(portal)/settings/page.tsx` — replace `currentUser()`; derive name/email from `user.user_metadata` and `user.email`

**Admin layout:**
- `app/(admin)/layout.tsx` — remove `clerkConfigured` prop passed to nav

**Server actions** (replace `auth()` with `getUser()`; rename `.eq("clerk_user_id", ...)` to `.eq("user_id", ...)`):
- `lib/actions/booking.ts` — replace `auth()` + rename payload field `clerk_user_id` → `user_id` + update `onConflict: "clinic_id,user_id"`
- `lib/actions/messages.ts` — replace `auth()` + rename `.eq("clerk_user_id", ...)` filter
- `lib/actions/records.ts` — replace `auth()` + rename `.eq("clerk_user_id", ...)` filters

**Nav components** (remove `clerkConfigured` prop; replace `<SignOutButton>` with shared component):
- `components/portal/portal-nav.tsx`
- `components/portal/portal-mobile-nav.tsx`
- `components/admin/admin-nav.tsx`
- `components/admin/admin-mobile-nav.tsx`

---

## Error Handling

- `getUser()` returns `null` on any error — never throws
- `requireUser()` redirects to `/sign-in` — never returns null
- `requireAdmin()` redirects to `/dashboard` if authenticated non-admin; redirects to `/sign-in?redirect_url=%2Fadmin` if unauthenticated
- Magic link and sign-in failures surface via Supabase's built-in `<Auth>` error states

---

## Testing Checklist

- [ ] Sign up with email+password → account created, lands on `/dashboard`
- [ ] Sign in with email+password → lands on `/dashboard`
- [ ] Magic link email received → link redirects to `/dashboard`
- [ ] Unauthenticated visit to `/dashboard` → redirects to `/sign-in`
- [ ] Unauthenticated visit to `/admin` → redirects to `/sign-in?redirect_url=%2Fadmin`
- [ ] Authenticated non-admin visit to `/admin` → redirects to `/dashboard`
- [ ] Admin visit to `/admin` → access granted
- [ ] Sign out from portal → redirects to `/sign-in`
- [ ] Sign out from admin → redirects to `/sign-in`
- [ ] Booking a new appointment as portal user → saves with correct `user_id`
- [ ] `npx tsc --noEmit` passes with zero errors after migration

---

## Out of Scope

- Stripe billing (Phase 2, unchanged)
- Social OAuth providers
- Password reset flow (handled automatically by Supabase `<Auth>` component's built-in "Forgot password" link; uses `/auth/callback` with `type=recovery` — already covered by the same allowlist entry)
