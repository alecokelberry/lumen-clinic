# Design: Remove Marketing Site — Portal + Admin Only

**Date:** 2026-03-17
**Status:** Approved

## Goal

Simplify the Lumen Clinic repo for portfolio presentation by removing all public-facing marketing pages and the onboarding wizard. The app becomes a focused two-surface product: patient portal + clinic admin dashboard.

## Scope

### Delete (no references kept)

| Path | Reason |
|------|--------|
| `app/(marketing)/` | All 5 marketing pages (home, services, providers, locations, about) + layout |
| `app/onboard/` | White-label clinic setup wizard — not relevant to portfolio demo |
| `components/shared/clinic-nav.tsx` | Marketing site navigation bar |
| `components/shared/clinic-footer.tsx` | Marketing site footer |
| `components/shared/book-button.tsx` | CTA button used only on marketing pages |

### Add

| Path | What |
|------|------|
| `app/page.tsx` | Single file: `redirect("/sign-in")` — root URL sends visitors to sign-in |

### Update

All files with `href="/"` or `redirectUrl="/"` that would become dead/looping links after the home page is removed.

| File | Change |
|------|--------|
| `app/book/layout.tsx` | Both `href="/"` links → `/dashboard` |
| `app/(portal)/layout.tsx` | Both `href="/"` clinic name links → `/dashboard` |
| `app/(admin)/layout.tsx` | Both `href="/"` clinic name links → `/admin` |
| `components/portal/portal-nav.tsx` | Remove "Back to site" `href="/"` link; change `redirectUrl="/"` on `<SignOutButton>` → `"/sign-in"` |
| `components/portal/portal-mobile-nav.tsx` | Remove "Back to site" `href="/"` link; change `redirectUrl="/"` on `<SignOutButton>` → `"/sign-in"` |
| `components/admin/admin-nav.tsx` | Change `redirectUrl="/"` on `<SignOutButton>` → `"/sign-in"` |
| `components/admin/admin-mobile-nav.tsx` | Change `redirectUrl="/"` on `<SignOutButton>` → `"/sign-in"` |
| `components/booking/step-confirm.tsx` | `href="/"` "Back to home" link → `/dashboard` |
| `app/sign-in/[[...sign-in]]/page.tsx` | Remove `href="/"` back-link (no home page to go back to) |
| `app/sign-up/[[...sign-up]]/page.tsx` | Remove `href="/"` back-link (no home page to go back to) |

### Untouched

- `app/(portal)/` — all patient portal pages (appointments, messages, records, billing, settings, dashboard)
- `app/(admin)/admin/` — all admin dashboard pages
- `app/book/page.tsx` — booking wizard page (stays at `/book`, used by portal)
- `components/booking/` — booking wizard step components (except `step-confirm.tsx` above)
- `components/portal/message-composer.tsx`
- `components/admin/` (all files except `admin-nav.tsx` and `admin-mobile-nav.tsx` above)
- `components/ui/` — shadcn UI primitives
- `components/clinic-brand-provider.tsx`
- All `lib/` server actions and utilities

## Architecture After Change

```
/ → redirect → /sign-in
/sign-in, /sign-up    Clerk auth (no back-to-home link)
/dashboard            Patient portal entry (Clerk-protected)
/appointments         Patient portal
/messages             Patient portal
/records              Patient portal
/billing              Patient portal
/settings             Patient portal
/book                 Booking wizard (portal-accessible)
/admin                Admin dashboard (Clerk-protected + admin role)
```

## Non-Goals

- No UI redesign
- No new features
- No refactoring of kept code
- No changes to database schema or server actions
