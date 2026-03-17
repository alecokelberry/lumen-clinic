# Supabase Auth Migration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk v7 with Supabase Auth (email+password + magic link) across the entire Lumen Clinic app.

**Architecture:** Cookie-based sessions via `@supabase/ssr`; new `lib/supabase/auth.ts` helper provides `getUser`/`requireUser`/`requireAdmin` for server components and actions; middleware rewrites to refresh session cookies on every request; pre-built `@supabase/auth-ui-react` `<Auth>` component replaces Clerk sign-in/sign-up pages.

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr` (already installed), `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`, Supabase PostgreSQL (RLS updated to use `auth.uid()`), TypeScript.

**Spec:** `docs/superpowers/specs/2026-03-17-supabase-auth-design.md`

---

## Chunk 1: Package swap + auth helpers + middleware

### Task 1: Install auth UI packages and remove Clerk

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the two new packages**

```bash
npm install @supabase/auth-ui-react @supabase/auth-ui-shared
```

Expected output: `added N packages` with no errors.

- [ ] **Step 2: Remove the Clerk package**

```bash
npm uninstall @clerk/nextjs
```

Expected: package removed, no errors.

- [ ] **Step 3: Verify the current error list**

```bash
node node_modules/next/dist/bin/next build 2>&1 | grep "error" | head -30
```

Expected: errors referencing `@clerk/nextjs` imports across portal pages, nav components, and `proxy.ts`. This is the working list for later tasks. `proxy.ts` errors will be fixed in Task 4 — do not skip to it first.

---

### Task 2: Create `lib/supabase/auth.ts`

**Files:**
- Create: `lib/supabase/auth.ts`

This file provides three server-side auth helpers used throughout the app. `getUser` calls the existing `createClient()` from `lib/supabase/server.ts` (which already uses `@supabase/ssr` with the `cookies()` adapter). `requireUser` and `requireAdmin` redirect if auth fails.

`app_metadata` on a Supabase user is set via SQL:
```sql
UPDATE auth.users SET raw_app_meta_data = '{"role":"admin"}' WHERE email = 'you@example.com';
```

- [ ] **Step 1: Create the file**

```typescript
// lib/supabase/auth.ts
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

/** Returns the current user or null. Never throws. */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}

/** Returns the current user or redirects to /sign-in. */
export async function requireUser(): Promise<User> {
  const user = await getUser()
  if (!user) redirect("/sign-in")
  return user
}

/**
 * Returns the current user only if app_metadata.role === "admin".
 * Authenticated non-admin → redirect to /dashboard.
 * Unauthenticated → redirect to /sign-in?redirect_url=%2Fadmin.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getUser()
  if (!user) redirect("/sign-in?redirect_url=%2Fadmin")
  const role = (user.app_metadata as { role?: string })?.role
  if (role !== "admin") redirect("/dashboard")
  return user
}
```

- [ ] **Step 2: Verify TypeScript is happy with this file**

```bash
npx tsc --noEmit 2>&1 | grep "lib/supabase/auth"
```

Expected: no output (no errors in this file).

---

### Task 3: Rewrite `lib/require-admin.ts`

**Files:**
- Modify: `lib/require-admin.ts`

This file is currently called from `app/(admin)/layout.tsx`. After this change it delegates to the new `requireAdmin()` in `lib/supabase/auth.ts`. Task 9 later rewrites the admin layout to import `requireAdmin` directly — at that point `lib/require-admin.ts` can be deleted entirely.

- [ ] **Step 1: Replace the entire file contents**

```typescript
// lib/require-admin.ts
export { requireAdmin } from "@/lib/supabase/auth"
```

This is a re-export so the existing dynamic import call in `app/(admin)/layout.tsx` keeps working until Task 9 rewrites it.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "require-admin"
```

Expected: no output.

---

### Task 4: Rewrite `proxy.ts` middleware

**Files:**
- Modify: `proxy.ts`

**Background:** The middleware must use a Supabase client built from `request`/`response` cookies — NOT the `createClient()` from `lib/supabase/server.ts`, which uses `cookies()` from `next/headers` (unavailable in middleware). The refreshed session cookie must be written onto the `response` object and that same `response` must be returned.

- [ ] **Step 1: Replace the entire file**

**Critical architecture note:** `lib/clinic.ts` calls `headers()` from `next/headers`, which reads *request* headers forwarded by the middleware. These must be set on the **request** side of `NextResponse` using `NextResponse.next({ request: { headers: enrichedHeaders } })` — NOT on `response.headers.set(...)` (that would be the response side, invisible to `headers()`).

The Supabase `setAll` callback also needs to rebuild the response using the same enriched request headers so the `x-clinic-slug` header survives a session cookie refresh.

```typescript
// proxy.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PORTAL_PATHS = ["/dashboard", "/appointments", "/messages", "/records", "/billing", "/forms", "/settings"]
const ADMIN_PATHS = ["/admin"]

function isPortalPath(pathname: string) {
  return PORTAL_PATHS.some((p) => pathname.startsWith(p))
}

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p))
}

/** Builds the enriched request headers (tenant slug + pathname). */
function buildRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers)
  headers.set("x-pathname", req.nextUrl.pathname)

  const hostname = req.headers.get("host") ?? ""
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lumenclinic.health"
  const hostWithoutPort = hostname.replace(/:\d+$/, "")

  if (
    hostWithoutPort !== rootDomain &&
    hostWithoutPort !== `www.${rootDomain}` &&
    hostWithoutPort !== "localhost"
  ) {
    const slug = hostWithoutPort.endsWith(`.${rootDomain}`)
      ? hostWithoutPort.replace(`.${rootDomain}`, "")
      : hostWithoutPort
    headers.set("x-clinic-slug", slug)
  }

  return headers
}

export default async function proxy(req: NextRequest) {
  // Build enriched request headers FIRST so they survive the Supabase setAll rebuild.
  const requestHeaders = buildRequestHeaders(req)

  // Create initial response with enriched headers on the request side.
  // This is what makes x-clinic-slug visible to lib/clinic.ts via headers().
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(cookiesToSet) {
          // Rebuild response with the SAME enriched requestHeaders so x-clinic-slug survives.
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  if (isAdminPath(pathname)) {
    if (!user) {
      const url = req.nextUrl.clone()
      url.pathname = "/sign-in"
      url.searchParams.set("redirect_url", pathname)
      return NextResponse.redirect(url)
    }
    const role = (user.app_metadata as { role?: string })?.role
    if (role !== "admin") {
      const url = req.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  } else if (isPortalPath(pathname)) {
    if (!user) {
      const url = req.nextUrl.clone()
      url.pathname = "/sign-in"
      url.searchParams.set("redirect_url", pathname)
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
```

- [ ] **Step 2: Verify the build compiles (Clerk errors should now be fewer — only the pages remain)**

```bash
node node_modules/next/dist/bin/next build 2>&1 | grep -E "error|Error" | head -20
```

Expected: errors remain only in portal/admin pages and nav components that still import `@clerk/nextjs`. `proxy.ts` should not appear in errors.

---

## Chunk 2: Layout cleanup + nav sign-out

### Task 5: Update `app/layout.tsx` — remove ClerkProviderWrapper

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the file**

```typescript
// app/layout.tsx
import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Lumen Clinic — Modern Medical Care",
    template: "%s | Lumen Clinic",
  },
  description: "Book appointments, message your care team, and manage your health — all in one place.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} antialiased`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Delete the now-unnecessary clerk-provider component**

Delete `components/clerk-provider.tsx` — it is no longer imported anywhere.

---

### Task 6: Create shared `SignOutButton` component

**Files:**
- Create: `components/shared/sign-out-button.tsx`

This is a `"use client"` component that calls `supabase.auth.signOut()` then navigates to `/sign-in`. The four nav components will replace Clerk's `<SignOutButton>` with this.

- [ ] **Step 1: Create the file**

```typescript
// components/shared/sign-out-button.tsx
"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export function SignOutButton({
  children,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>
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

  return (
    <button
      onClick={handleSignOut}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </button>
  )
}
```

---

### Task 7: Update portal nav components

**Files:**
- Modify: `components/portal/portal-nav.tsx`
- Modify: `components/portal/portal-mobile-nav.tsx`

Remove the `clerkConfigured` prop and replace Clerk's `<SignOutButton>` with the new shared component. The sign-out button is now always rendered (no `clerkConfigured` guard needed).

- [ ] **Step 1: Replace `components/portal/portal-nav.tsx`**

```typescript
// components/portal/portal-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, MessageSquare, FileText, CreditCard, Settings, LayoutDashboard, LogOut } from "lucide-react"
import { SignOutButton } from "@/components/shared/sign-out-button"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Messages",     href: "/messages",     icon: MessageSquare },
  { label: "Records",      href: "/records",      icon: FileText },
  { label: "Billing",      href: "/billing",      icon: CreditCard },
  { label: "Settings",     href: "/settings",     icon: Settings },
]

export function PortalNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors")}
              style={isActive
                ? { background: "rgba(255,255,255,0.12)", color: "#ffffff" }
                : { color: "#94a3b8" }
              }
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0" } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#94a3b8" } }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
        <SignOutButton
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: "#64748b" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </SignOutButton>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Replace `components/portal/portal-mobile-nav.tsx`**

```typescript
// components/portal/portal-mobile-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, CalendarDays, MessageSquare, FileText, CreditCard, Settings, LayoutDashboard, LogOut } from "lucide-react"
import { SignOutButton } from "@/components/shared/sign-out-button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Messages",     href: "/messages",     icon: MessageSquare },
  { label: "Records",      href: "/records",      icon: FileText },
  { label: "Billing",      href: "/billing",      icon: CreditCard },
  { label: "Settings",     href: "/settings",     icon: Settings },
]

export function PortalMobileNav({ clinicName }: { clinicName: string }) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10">
          <Menu className="h-5 w-5" style={{ color: "#f1f5f9" }} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="flex w-64 flex-col p-0" style={{ background: "#0f172a", border: "none" }}>
        <div className="flex h-14 items-center px-5" style={{ borderBottom: "1px solid #1e293b" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
            {clinicName}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors")}
                style={isActive
                  ? { background: "rgba(255,255,255,0.12)", color: "#ffffff" }
                  : { color: "#94a3b8" }
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
          <SignOutButton
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </SignOutButton>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

### Task 8: Update admin nav components

**Files:**
- Modify: `components/admin/admin-nav.tsx`
- Modify: `components/admin/admin-mobile-nav.tsx`

Same pattern as portal navs — remove `clerkConfigured` prop, swap to shared `SignOutButton`.

- [ ] **Step 1: Replace `components/admin/admin-nav.tsx`**

```typescript
// components/admin/admin-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@/components/shared/sign-out-button"
import { LogOut, CalendarDays, Users, LayoutDashboard, Settings2, MessageSquare, UserRound, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Bookings",  href: "/admin",           icon: CalendarDays },
  { label: "Messages",  href: "/admin/messages",  icon: MessageSquare },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Patients",  href: "/admin/patients",  icon: UserRound },
  { label: "Overview",  href: "/admin/overview",  icon: LayoutDashboard },
  { label: "Settings",  href: "/admin/settings",  icon: Settings2 },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
              style={isActive
                ? { background: "rgba(255,255,255,0.12)", color: "#ffffff" }
                : { color: "#94a3b8" }
              }
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#e2e8f0" } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#94a3b8" } }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: "#64748b" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Patient Portal
        </Link>
        <SignOutButton
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: "#64748b" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </SignOutButton>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Replace `components/admin/admin-mobile-nav.tsx`**

```typescript
// components/admin/admin-mobile-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, CalendarDays, Users, LayoutDashboard, Settings2, MessageSquare, UserRound, LogOut, ArrowLeft } from "lucide-react"
import { SignOutButton } from "@/components/shared/sign-out-button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Bookings",  href: "/admin",           icon: CalendarDays },
  { label: "Messages",  href: "/admin/messages",  icon: MessageSquare },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Patients",  href: "/admin/patients",  icon: UserRound },
  { label: "Overview",  href: "/admin/overview",  icon: LayoutDashboard },
  { label: "Settings",  href: "/admin/settings",  icon: Settings2 },
]

export function AdminMobileNav({ clinicName }: { clinicName: string }) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10">
          <Menu className="h-5 w-5" style={{ color: "#f1f5f9" }} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="flex w-64 flex-col p-0" style={{ background: "#0f172a", border: "none" }}>
        <div className="flex h-14 items-center gap-2 px-5" style={{ borderBottom: "1px solid #1e293b" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
            {clinicName}
          </span>
          <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
            Admin
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors")}
                style={isActive
                  ? { background: "rgba(255,255,255,0.12)", color: "#ffffff" }
                  : { color: "#94a3b8" }
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Patient Portal
          </Link>
          <SignOutButton
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </SignOutButton>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

### Task 9: Update portal and admin layouts

**Files:**
- Modify: `app/(portal)/layout.tsx`
- Modify: `app/(admin)/layout.tsx`

Remove `clerkConfigured` flag, remove dynamic Clerk imports, replace with `requireUser()` / `requireAdmin()`, and update nav component call sites to remove the now-deleted `clerkConfigured` prop.

- [ ] **Step 1: Verify nothing imports `NAV_ITEMS` from the admin layout before modifying it**

```bash
grep -r "from.*admin/layout" /Users/alecokelberry/developer/lumen-clinic/app --include="*.tsx" --include="*.ts"
```

Expected: no output. If there are matches, update those files before replacing the layout.

- [ ] **Step 2: Replace `app/(portal)/layout.tsx`**

```typescript
// app/(portal)/layout.tsx
import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import { PortalNav } from "@/components/portal/portal-nav"
import { PortalMobileNav } from "@/components/portal/portal-mobile-nav"
import { requireUser } from "@/lib/supabase/auth"

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()

  const clinic = await getClinic()

  return (
    <ClinicBrandProvider
      primaryColor={clinic.primary_color}
      accentColor={clinic.accent_color ?? "#eff6ff"}
    >
      <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
        {/* Sidebar */}
        <aside
          className="hidden w-56 shrink-0 flex-col md:flex"
          style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}
        >
          <div className="flex h-14 items-center gap-2 px-5" style={{ borderBottom: "1px solid #1e293b" }}>
            <Link href="/dashboard" className="transition-opacity hover:opacity-70">
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                {clinic.name}
              </span>
            </Link>
          </div>
          <PortalNav />
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          <header
            className="flex h-14 items-center gap-3 px-4 md:hidden"
            style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}
          >
            <PortalMobileNav clinicName={clinic.name} />
            <Link href="/dashboard">
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }}>
                {clinic.name}
              </span>
            </Link>
          </header>
          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
      <Toaster />
    </ClinicBrandProvider>
  )
}
```

- [ ] **Step 3: Replace `app/(admin)/layout.tsx`**

```typescript
// app/(admin)/layout.tsx
import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"
import { requireAdmin } from "@/lib/supabase/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  const clinic = await getClinic()

  return (
    <ClinicBrandProvider
      primaryColor={clinic.primary_color}
      accentColor={clinic.accent_color ?? "#eff6ff"}
    >
      <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
        {/* Sidebar */}
        <aside
          className="hidden w-56 shrink-0 flex-col md:flex"
          style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}
        >
          <div className="flex h-14 items-center gap-2 px-5" style={{ borderBottom: "1px solid #1e293b" }}>
            <Link href="/admin" className="transition-opacity hover:opacity-70">
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                {clinic.name}
              </span>
            </Link>
            <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
              Admin
            </span>
          </div>

          <AdminNav />
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          <header
            className="flex h-14 items-center gap-3 px-4 md:hidden"
            style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}
          >
            <AdminMobileNav clinicName={clinic.name} />
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9" }}>
                  {clinic.name}
                </span>
              </Link>
              <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
                Admin
              </span>
            </div>
          </header>
          <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
      <Toaster />
    </ClinicBrandProvider>
  )
}
```

- [ ] **Step 4: Delete `lib/require-admin.ts`**

The admin layout now imports `requireAdmin` directly from `lib/supabase/auth`, making the re-export file orphaned. Delete it:

```bash
rm lib/require-admin.ts
```

Then verify no remaining imports reference it:

```bash
grep -r "require-admin" /Users/alecokelberry/developer/lumen-clinic --include="*.ts" --include="*.tsx"
```

Expected: no output.

---

## Chunk 3: Portal pages + server actions

### Task 10: Update `app/page.tsx` (landing page)

**Files:**
- Modify: `app/page.tsx`

Remove `clerkConfigured` — both buttons always point to `/sign-in`.

- [ ] **Step 1: Replace the file**

```typescript
// app/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Welcome" }

export default function RootPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "1rem" }}>
      <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", fontWeight: 700, color: "#0f172a", letterSpacing: "-0.03em", margin: 0 }}>
          Lumen Clinic
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
          Choose how you&apos;d like to sign in
        </p>
      </div>

      <div style={{ display: "flex", gap: "1rem" }}>
        <a
          href="/sign-in"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", borderRadius: "1rem", border: "1px solid #e2e8f0", background: "#ffffff", padding: "2rem", textAlign: "center", textDecoration: "none", width: "160px" }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>Patient Portal</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Appointments &amp; records</p>
          </div>
        </a>

        <a
          href="/sign-in?redirect_url=%2Fadmin"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", borderRadius: "1rem", border: "1px solid #e2e8f0", background: "#ffffff", padding: "2rem", textAlign: "center", textDecoration: "none", width: "160px" }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: "#0f172a", fontSize: "0.9375rem" }}>Admin</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#64748b" }}>Clinic dashboard</p>
          </div>
        </a>
      </div>
    </div>
  )
}
```

---

### Task 11: Update portal pages — replace Clerk auth

**Files:**
- Modify: `app/(portal)/dashboard/page.tsx`
- Modify: `app/(portal)/appointments/page.tsx`
- Modify: `app/(portal)/appointments/[id]/reschedule/page.tsx`
- Modify: `app/(portal)/appointments/[id]/intake/page.tsx`
- Modify: `app/(portal)/messages/page.tsx`
- Modify: `app/(portal)/records/page.tsx`
- Modify: `app/(portal)/settings/page.tsx`

The portal layout already calls `requireUser()`, so these pages are guaranteed to have an authenticated user. Each page just needs to get the user ID for patient lookups.

**Pattern to apply to every page:** Remove the `clerkConfigured` module-level constant and the dynamic Clerk import block. Replace with:

```typescript
import { getUser } from "@/lib/supabase/auth"
// ...
const user = await getUser()
const userId = user?.id ?? null
// (replace all references to clerkUserId with userId)
// (replace all .eq("clerk_user_id", ...) with .eq("user_id", ...))
```

- [ ] **Step 1: Update `app/(portal)/dashboard/page.tsx`**

Key changes:
- Remove `clerkConfigured` constant and all `if (clerkConfigured)` guards
- Import `getUser` from `@/lib/supabase/auth`
- Replace `clerkUserId` with `user?.id`
- Change `.eq("clerk_user_id", clerkUserId)` → `.eq("user_id", userId)`
- Replace the `currentUser()` / `firstName` block with: `const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there"`

Full replacement:

```typescript
// app/(portal)/dashboard/page.tsx
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { getUser } from "@/lib/supabase/auth"
import { Button } from "@/components/ui/button"
import { CalendarDays, MessageSquare, FileText, CreditCard, Clock, MapPin, Video, Plus, ArrowRight, ChevronRight } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}
function formatApptTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  confirmed: { label: "Confirmed", bg: "#f0fdf4", color: "#15803d" },
  scheduled: { label: "Scheduled", bg: "#eff6ff", color: "#1d4ed8" },
  completed: { label: "Completed", bg: "#f8fafc", color: "#64748b" },
  cancelled: { label: "Cancelled", bg: "#fef2f2", color: "#dc2626" },
  "no-show": { label: "No show",   bg: "#fff7ed", color: "#c2410c" },
}

const QUICK_ACTIONS = [
  { label: "Book Appointment", href: "/book",     icon: CalendarDays, bg: "#eff6ff", color: "#2563eb" },
  { label: "Messages",         href: "/messages", icon: MessageSquare, bg: "#f0fdf4", color: "#16a34a" },
  { label: "Medical Records",  href: "/records",  icon: FileText,      bg: "#faf5ff", color: "#7c3aed" },
  { label: "Billing",          href: "/billing",  icon: CreditCard,    bg: "#fffbeb", color: "#d97706" },
]

export default async function DashboardPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()
  const user = await getUser()
  const userId = user?.id ?? null

  let appointments: Array<{
    id: string; start_at: string; status: string; is_virtual: boolean
    providers: { name: string } | null
    services: { name: string } | null
    locations: { name: string } | null
  }> = []

  if (userId) {
    const { data: patient } = await supabase
      .from("patients").select("id")
      .eq("clinic_id", clinic.id).eq("user_id", userId).single()
    const patientId = (patient as { id: string } | null)?.id
    if (patientId) {
      const { data } = await supabase
        .from("appointments")
        .select("id, start_at, status, is_virtual, providers(name), services(name), locations(name)")
        .eq("patient_id", patientId)
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(5)
      appointments = (data ?? []) as typeof appointments
    }
  }

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0]
    ?? user?.email?.split("@")[0]
    ?? "there"

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Greeting */}
      <div>
        <h1 className="font-bold text-slate-900" style={{ fontSize: "1.375rem", letterSpacing: "-0.02em" }}>
          Good morning, {firstName}
        </h1>
      </div>

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition-all hover:shadow-sm"
            style={{ borderColor: "#e2e8f0" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: action.bg }}>
              <action.icon className="h-4 w-4" style={{ color: action.color }} />
            </div>
            <span className="text-xs font-medium leading-tight text-slate-700">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Upcoming appointments */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming appointments</h2>
          <Button asChild size="sm" className="h-8 px-3 text-xs text-white hover:opacity-90" style={{ background: "var(--clinic-primary)" }}>
            <Link href="/book">
              <Plus className="mr-1 h-3 w-3" />
              Book new
            </Link>
          </Button>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-white py-10 text-center" style={{ borderColor: "#e2e8f0" }}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#f8fafc" }}>
              <CalendarDays className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">No upcoming appointments</p>
              <p className="mt-0.5 text-sm text-slate-500">Book your next visit in under a minute.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
            <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
              {appointments.map((appt) => {
                const cfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled
                return (
                  <Link
                    key={appt.id}
                    href="/appointments"
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 group"
                  >
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: "#eff6ff" }}>
                      <span className="text-xs font-semibold uppercase leading-none" style={{ color: "var(--clinic-primary)" }}>
                        {new Date(appt.start_at).toLocaleDateString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-none" style={{ color: "var(--clinic-primary)" }}>
                        {new Date(appt.start_at).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {appt.services?.name ?? "Appointment"}
                        </p>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatApptDate(appt.start_at)} · {formatApptTime(appt.start_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          {appt.is_virtual
                            ? <><Video className="h-3 w-3" /> Telehealth</>
                            : <><MapPin className="h-3 w-3" /> {appt.locations?.name}</>
                          }
                        </span>
                      </div>
                      {appt.providers?.name && (
                        <p className="mt-0.5 text-xs text-slate-400">{appt.providers.name}</p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )
              })}
            </div>

            <Link
              href="/appointments"
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors hover:bg-slate-50"
              style={{ borderTop: "1px solid #f1f5f9", color: "var(--clinic-primary)" }}
            >
              View all appointments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Update `app/(portal)/appointments/page.tsx`**

Apply the pattern:
- Remove `clerkConfigured` constant
- Add `import { getUser } from "@/lib/supabase/auth"`
- Replace the `if (clerkConfigured) { auth() }` block with `const user = await getUser(); const clerkUserId = user?.id ?? null` (rename variable to `userId` throughout)
- Change `.eq("clerk_user_id", clerkUserId)` → `.eq("user_id", userId)`

- [ ] **Step 3: Update `app/(portal)/appointments/[id]/reschedule/page.tsx`**

Same pattern — remove `clerkConfigured`, import `getUser`, replace auth block, no `clerk_user_id` column references (this page only checks `userId` for redirect, then queries by appointment id).

- [ ] **Step 4: Update `app/(portal)/appointments/[id]/intake/page.tsx`**

Same pattern.

- [ ] **Step 5: Update `app/(portal)/messages/page.tsx`**

Same pattern — remove `clerkConfigured`, import `getUser`, change `.eq("clerk_user_id", userId)` → `.eq("user_id", userId)`.

- [ ] **Step 6: Update `app/(portal)/records/page.tsx`**

Same pattern — change `.eq("clerk_user_id", userId)` → `.eq("user_id", userId)`.

- [ ] **Step 7: Update `app/(portal)/settings/page.tsx`**

Replace the entire `clerkConfigured` / `currentUser()` block with Supabase user data:

```typescript
// app/(portal)/settings/page.tsx
import { getUser } from "@/lib/supabase/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const user = await getUser()
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? ""
  const nameParts = fullName.trim().split(" ")
  const firstName = nameParts[0] ?? ""
  const lastName = nameParts.slice(1).join(" ")
  const email = user?.email ?? ""

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card className="border border-border/60">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your name and email are managed through your account provider.
          </p>

          <Separator className="my-5" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first-name" className="text-xs">First name</Label>
              <Input id="first-name" defaultValue={firstName} placeholder="—" disabled className="bg-muted/40 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name" className="text-xs">Last name</Label>
              <Input id="last-name" defaultValue={lastName} placeholder="—" disabled className="bg-muted/40 text-sm" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" defaultValue={email} placeholder="—" disabled className="bg-muted/40 text-sm" />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            To update your name or email, visit your account settings.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Appointment reminders and communication preferences — coming soon.
          </p>
          <Button variant="outline" size="sm" className="mt-4" disabled>
            Manage notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Task 12: Update server actions

**Files:**
- Modify: `lib/actions/booking.ts`
- Modify: `lib/actions/messages.ts`
- Modify: `lib/actions/records.ts`

**Pattern:** Remove `clerkConfigured` module-level constant, import `getUser`, replace dynamic `auth()` import with `await getUser()`.

- [ ] **Step 1: Update `lib/actions/booking.ts`**

Three changes:
1. Remove `clerkConfigured` constant (line ~7)
2. Replace the auth block (around lines 88–113) with Supabase `getUser()`
3. Rename `clerk_user_id` → `user_id` in the upsert payload AND in `onConflict`

Replace the relevant section:

```typescript
// Replace the clerkConfigured constant at top of file with:
import { getUser } from "@/lib/supabase/auth"

// Replace the auth block (lines ~88-113) with:
  const user = await getUser()
  if (user) {
    const nameParts = input.guestName.trim().split(" ")
    const firstName = nameParts[0] ?? ""
    const lastName = nameParts.slice(1).join(" ") || firstName

    const { data: patient } = await supabase
      .from("patients")
      .upsert(
        {
          clinic_id: clinic.id,
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: input.guestEmail,
          phone: input.guestPhone || null,
        },
        { onConflict: "clinic_id,user_id", ignoreDuplicates: false }
      )
      .select("id")
      .single()
    patientId = (patient as { id: string } | null)?.id ?? null
  }
```

- [ ] **Step 2: Update `lib/actions/messages.ts`**

Replace the `clerkConfigured` block with:

```typescript
import { getUser } from "@/lib/supabase/auth"

// In sendPatientMessage:
  const user = await getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("clinic_id", clinic.id)
    .eq("user_id", user.id)
    .single()
  patientId = (patient as { id: string } | null)?.id ?? null
```

Remove `const clerkConfigured = ...` and the `if (clerkConfigured)` guard.

- [ ] **Step 3: Update `lib/actions/records.ts`**

This file has two functions with Clerk auth (`uploadRecord` and `deleteRecord`). Replace the full file:

```typescript
// lib/actions/records.ts
"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { getUser } from "@/lib/supabase/auth"
import { revalidatePath } from "next/cache"

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

const MAX_BYTES = 10 * 1024 * 1024  // 10 MB

export async function uploadRecord(formData: FormData): Promise<{ error?: string }> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const user = await getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: p } = await supabase
    .from("patients").select("id")
    .eq("clinic_id", clinic.id).eq("user_id", user.id).single()
  const patientId = (p as { id: string } | null)?.id ?? null

  if (!patientId) return { error: "Patient record not found." }

  const file = formData.get("file") as File | null
  type RecordCategory = "lab_result" | "imaging" | "insurance" | "visit_summary" | "other"
  const category = ((formData.get("category") as string) || "other") as RecordCategory
  const notes = (formData.get("notes") as string) || ""

  if (!file || file.size === 0) return { error: "No file selected." }
  if (file.size > MAX_BYTES) return { error: "File must be under 10 MB." }
  if (!ALLOWED_TYPES.has(file.type)) return { error: "File type not supported." }

  const ext = file.name.split(".").pop() ?? "bin"
  const filePath = `${clinic.id}/${patientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const fileBody = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from("medical-records")
    .upload(filePath, fileBody, { contentType: file.type, upsert: false })

  if (uploadError) return { error: uploadError.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await supabase
    .from("medical_records")
    .insert({
      clinic_id: clinic.id,
      patient_id: patientId,
      uploaded_by: "patient",
      category,
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      notes: notes.trim() || null,
    })

  if (dbError) {
    await supabase.storage.from("medical-records").remove([filePath])
    return { error: dbError.message }
  }

  revalidatePath("/records")
  return {}
}

export async function getSignedUrl(filePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createServiceClient()
  const { data, error } = await supabase.storage
    .from("medical-records")
    .createSignedUrl(filePath, 60 * 60) // 1 hour
  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

export async function deleteRecord(recordId: string, filePath: string): Promise<{ error?: string }> {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const user = await getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: p } = await supabase
    .from("patients").select("id")
    .eq("clinic_id", clinic.id).eq("user_id", user.id).single()
  const patientId = (p as { id: string } | null)?.id ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: dbError } = await supabase
    .from("medical_records")
    .delete()
    .eq("id", recordId)
    .eq("patient_id", patientId ?? "")

  if (dbError) return { error: dbError.message }

  await supabase.storage.from("medical-records").remove([filePath])

  revalidatePath("/records")
  return {}
}
```

---

### Task 13: Rename `clerk_user_id` in `lib/supabase/types.ts`

**Files:**
- Modify: `lib/supabase/types.ts`

This must happen BEFORE the TypeScript check in Task 14. The server actions updated in Task 12 now reference `user_id` in upsert payloads and `.eq()` filters — if the type still says `clerk_user_id`, the compiler will error on those call sites.

- [ ] **Step 1: Find all occurrences**

```bash
grep -n "clerk_user_id" lib/supabase/types.ts
```

- [ ] **Step 2: Replace every occurrence with `user_id`**

Use find-replace. All three type variants (Row, Insert, Update) on the `patients` table have this field.

- [ ] **Step 3: Confirm none remain**

```bash
grep "clerk_user_id" lib/supabase/types.ts
```

Expected: no output.

---

## Chunk 4: Sign-in/Sign-up pages + auth callback

### Task 14: Run TypeScript check

- [ ] **Step 1: Check for any remaining Clerk references in type errors**

```bash
npx tsc --noEmit 2>&1 | grep -i "clerk"
```

Expected: no output.

- [ ] **Step 2: Run full type check**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Expected: zero errors. Fix any that appear before proceeding.

---

### Task 15: Create `app/auth/callback/route.ts`

**Files:**
- Create: `app/auth/callback/route.ts`

This Route Handler is called by Supabase after magic link / OTP clicks. It exchanges the one-time code for a session and then redirects to the intended destination. Uses a `NextResponse`-backed cookie adapter so the session cookie is correctly set on the redirect response.

- [ ] **Step 1: Create the file**

```typescript
// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function GET(request: NextRequest) {
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
          getAll() { return request.cookies.getAll() },
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

> After deploying, add `http://localhost:3000/auth/callback` to the "Redirect URLs" allowlist in Supabase Dashboard → Authentication → URL Configuration.

---

### Task 16: Replace sign-in and sign-up pages

**Files:**
- Delete: `app/sign-in/[[...sign-in]]/` (directory)
- Create: `app/sign-in/page.tsx`
- Delete: `app/sign-up/[[...sign-up]]/` (directory)
- Create: `app/sign-up/page.tsx`

**Background:** `@supabase/auth-ui-react` requires a browser client (`createBrowserClient`). The `<Auth>` component itself is a client component. We wrap it in a thin `"use client"` component so the parent page can be a Server Component (to fetch `clinic.primary_color` from Supabase server-side and pass it as a prop).

The `ThemeSupa` theme system accepts static hex tokens — it does not read CSS variables. The clinic's brand color must be passed as a string.

- [ ] **Step 1: Delete the catchall directories**

```bash
rm -rf app/sign-in/\[\[...sign-in\]\]
rm -rf app/sign-up/\[\[...sign-up\]\]
```

- [ ] **Step 2: Create `app/sign-in/page.tsx`**

```typescript
// app/sign-in/page.tsx
import { getClinic } from "@/lib/clinic"
import { AuthForm } from "@/components/auth/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Sign In" }

export default async function SignInPage() {
  const clinic = await getClinic()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 py-12">
      <AuthForm view="sign_in" primaryColor={clinic.primary_color} />
    </div>
  )
}
```

- [ ] **Step 3: Create `app/sign-up/page.tsx`**

```typescript
// app/sign-up/page.tsx
import { getClinic } from "@/lib/clinic"
import { AuthForm } from "@/components/auth/auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Create Account" }

export default async function SignUpPage() {
  const clinic = await getClinic()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 py-12">
      <AuthForm view="sign_up" primaryColor={clinic.primary_color} />
    </div>
  )
}
```

- [ ] **Step 4: Create `components/auth/auth-form.tsx`**

```typescript
// components/auth/auth-form.tsx
"use client"

import { createBrowserClient } from "@supabase/ssr"
import { Auth } from "@supabase/auth-ui-react"
import { ThemeSupa } from "@supabase/auth-ui-shared"

export function AuthForm({
  view,
  primaryColor,
}: {
  view: "sign_in" | "sign_up"
  primaryColor: string
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return (
    <div style={{ width: "100%", maxWidth: "28rem" }}>
      <Auth
        supabaseClient={supabase}
        view={view}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: primaryColor,
                brandAccent: primaryColor,
                brandButtonText: "#ffffff",
              },
            },
          },
          style: {
            button: { borderRadius: "0.5rem" },
            container: {
              boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
              border: "1px solid #e2e8f0",
              borderRadius: "1rem",
              padding: "2rem",
              background: "#ffffff",
            },
          },
        }}
        providers={[]}
        redirectTo={
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : "/auth/callback"
        }
        showLinks
        additionalData={view === "sign_up" ? { full_name: "" } : undefined}
      />
    </div>
  )
}
```

---

## Chunk 5: Database migration + final verification

### Task 17: Apply database migrations

**Files:**
- Create: `supabase/migrations/008_supabase_auth_rls.sql`
- Modify: `supabase/migrations/001_initial_schema.sql`
- Modify: `supabase/migrations/003_messages.sql`
- Modify: `supabase/migrations/004_medical_records.sql`
- Modify: `supabase/migrations/007_seed_patients.sql`

- [ ] **Step 1: Create `supabase/migrations/008_supabase_auth_rls.sql`**

This migration handles the live database. Run it once in the Supabase SQL editor.

```sql
-- 008_supabase_auth_rls.sql
-- Migrates patients.clerk_user_id → patients.user_id
-- Updates all RLS policies from auth.jwt() ->> 'sub' to auth.uid()::text

-- 1. Rename column
ALTER TABLE public.patients RENAME COLUMN clerk_user_id TO user_id;

-- 2. Rename unique constraint
-- First verify the constraint name:
--   SELECT constraint_name FROM information_schema.table_constraints
--   WHERE table_name = 'patients' AND constraint_type = 'UNIQUE';
-- Then run:
ALTER TABLE public.patients
  RENAME CONSTRAINT patients_clinic_id_clerk_user_id_key
  TO patients_clinic_id_user_id_key;

-- 3. Fix patients RLS policy
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

- [ ] **Step 2: Update `supabase/migrations/001_initial_schema.sql` for fresh envs**

Make these four targeted changes:
1. Line ~104: `clerk_user_id text not null` → `user_id text not null`
2. Line ~112: `unique (clinic_id, clerk_user_id)` → `unique (clinic_id, user_id)`
3. Line ~117: `auth.jwt() ->> 'sub' = clerk_user_id` → `auth.uid()::text = user_id`
4. Line ~148: `clerk_user_id = auth.jwt() ->> 'sub'` → `auth.uid()::text = user_id`

- [ ] **Step 3: Update `supabase/migrations/003_messages.sql`**

Line ~18: `clerk_user_id = auth.jwt() ->> 'sub'` → `auth.uid()::text = user_id`

- [ ] **Step 4: Update `supabase/migrations/004_medical_records.sql`**

Line ~22: `clerk_user_id = auth.jwt() ->> 'sub'` → `auth.uid()::text = user_id`

- [ ] **Step 5: Update `supabase/migrations/007_seed_patients.sql`**

Find the `INSERT INTO public.patients` statement and change the column name `clerk_user_id` → `user_id` in both the column list and the values.

- [ ] **Step 6: Run `008_supabase_auth_rls.sql` in Supabase SQL editor**

Go to Supabase Dashboard → SQL Editor → paste the contents of `008_supabase_auth_rls.sql` → run.

Verify success:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'patients' AND table_schema = 'public';
```
Expected: `user_id` appears; `clerk_user_id` does not.

---

### Task 18: Final build verification

- [ ] **Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 2: Run build**

```bash
node node_modules/next/dist/bin/next build
```

Expected: build succeeds, zero errors. Note the route count — should be comparable to before.

- [ ] **Step 3: Start dev server and smoke test**

```bash
node node_modules/next/dist/bin/next dev --turbopack
```

Manual smoke tests (see spec testing checklist):
1. Visit `http://localhost:3000` → see landing page with Patient Portal + Admin cards
2. Click "Patient Portal" → lands on `/sign-in`
3. Sign up with email+password → creates account, lands on `/dashboard`
4. Sign out → lands on `/sign-in`
5. Sign back in → lands on `/dashboard`
6. Visit `/admin` without admin role → redirects to `/dashboard`
7. Request magic link → receive email → click link → lands on `/dashboard`

- [ ] **Step 4: Configure Supabase redirect URL**

In Supabase Dashboard → Authentication → URL Configuration, add:
```
http://localhost:3000/auth/callback
```

---

## Post-migration: Set admin role

To grant a user admin access after migration:

```sql
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'),
  '{role}',
  '"admin"'
)
WHERE email = 'your-admin@example.com';
```

Then test: sign in as that user → visit `/admin` → access granted.
