# Remove Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strip all public-facing marketing pages, the onboarding wizard, and dead `/` links from the codebase, leaving only the patient portal and admin dashboard.

**Architecture:** Hard deletion of marketing route group and shared marketing components; a single new `app/page.tsx` redirects `/` to `/sign-in`; all existing `href="/"` and `redirectUrl="/"` references in kept files are updated to their correct portal/admin destinations.

**Tech Stack:** Next.js 16 App Router, Clerk v7, TypeScript

---

## Chunk 1: Delete marketing and onboarding code

### Task 1: Delete the marketing route group

**Files:**
- Delete: `app/(marketing)/` (entire directory — 5 pages + layout)

- [ ] **Step 1: Delete the marketing directory**

```bash
rm -rf app/\(marketing\)
```

- [ ] **Step 2: Verify it's gone**

```bash
ls app/
```
Expected: no `(marketing)` entry.

---

### Task 2: Delete the onboarding wizard

**Files:**
- Delete: `app/onboard/` (entire directory)

- [ ] **Step 1: Delete the onboard directory**

```bash
rm -rf app/onboard
```

- [ ] **Step 2: Verify it's gone**

```bash
ls app/
```
Expected: no `onboard` entry.

---

### Task 3: Delete unused shared components

**Files:**
- Delete: `components/shared/clinic-nav.tsx`
- Delete: `components/shared/clinic-footer.tsx`
- Delete: `components/shared/book-button.tsx`

- [ ] **Step 1: Delete the three shared marketing components**

```bash
rm components/shared/clinic-nav.tsx components/shared/clinic-footer.tsx components/shared/book-button.tsx
```

- [ ] **Step 2: Verify the shared directory**

```bash
ls components/shared/
```
Expected: only non-marketing files remain (if `components/shared/` is now empty, the directory can be removed too with `rmdir components/shared`).

- [ ] **Step 3: Commit deletions**

```bash
git add -A
git commit -m "remove marketing pages, onboarding wizard, and shared marketing components"
```

---

## Chunk 2: Add root redirect and fix dead links

### Task 4: Add root redirect

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Create the root redirect page**

Create `app/page.tsx` with:

```tsx
import { redirect } from "next/navigation"

export default function RootPage() {
  redirect("/sign-in")
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "redirect root / to /sign-in"
```

---

### Task 5: Fix links in booking layout

**Files:**
- Modify: `app/book/layout.tsx`

Both `href="/"` links (clinic name + X exit button) must become `href="/dashboard"`.

- [ ] **Step 1: Update clinic name link**

In `app/book/layout.tsx` line 23, change:
```tsx
<Link href="/" className="font-display text-lg font-medium text-foreground hover:opacity-70 transition-opacity">
```
to:
```tsx
<Link href="/dashboard" className="font-display text-lg font-medium text-foreground hover:opacity-70 transition-opacity">
```

- [ ] **Step 2: Update exit button link**

On line 27, change:
```tsx
href="/"
```
to:
```tsx
href="/dashboard"
```

- [ ] **Step 3: Commit**

```bash
git add app/book/layout.tsx
git commit -m "fix booking layout exit links to point to /dashboard"
```

---

### Task 6: Fix links in portal layout

**Files:**
- Modify: `app/(portal)/layout.tsx`

Two `href="/"` clinic name links (sidebar + mobile header) → `/dashboard`.

- [ ] **Step 1: Update sidebar clinic name link (line 38)**

Change:
```tsx
<Link href="/" className="transition-opacity hover:opacity-70">
```
to:
```tsx
<Link href="/dashboard" className="transition-opacity hover:opacity-70">
```

- [ ] **Step 2: Update mobile header clinic name link (line 55)**

Change:
```tsx
<Link href="/">
```
to:
```tsx
<Link href="/dashboard">
```

- [ ] **Step 3: Commit**

```bash
git add app/\(portal\)/layout.tsx
git commit -m "fix portal layout clinic name links to point to /dashboard"
```

---

### Task 7: Fix links in admin layout

**Files:**
- Modify: `app/(admin)/layout.tsx`

Two `href="/"` clinic name links (sidebar + mobile header) → `/admin`.

- [ ] **Step 1: Update sidebar clinic name link (line 46)**

Change:
```tsx
<Link href="/" className="transition-opacity hover:opacity-70">
```
to:
```tsx
<Link href="/admin" className="transition-opacity hover:opacity-70">
```

- [ ] **Step 2: Update mobile header clinic name link (line 68)**

Change:
```tsx
<Link href="/">
```
to:
```tsx
<Link href="/admin">
```

- [ ] **Step 3: Commit**

```bash
git add app/\(admin\)/layout.tsx
git commit -m "fix admin layout clinic name links to point to /admin"
```

---

### Task 8: Fix portal nav components

**Files:**
- Modify: `components/portal/portal-nav.tsx`
- Modify: `components/portal/portal-mobile-nav.tsx`

Remove the "Back to site" link (no public site exists); update `redirectUrl="/"` → `"/sign-in"` on `<SignOutButton>`.

- [ ] **Step 1: Update portal-nav.tsx**

Remove the entire "Back to site" `<Link>` block (lines 46–55):
```tsx
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: "#64748b" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to site
        </Link>
```

Also update `redirectUrl="/"` → `redirectUrl="/sign-in"`.

Also remove the now-unused `ArrowLeft` import from the lucide-react import line.

- [ ] **Step 2: Update portal-mobile-nav.tsx**

Remove the "Back to site" `<Link>` block (lines 60–67):
```tsx
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to site
          </Link>
```

Also update `redirectUrl="/"` → `redirectUrl="/sign-in"`.

Also remove the now-unused `ArrowLeft` import from the lucide-react import line.

- [ ] **Step 3: Commit**

```bash
git add components/portal/portal-nav.tsx components/portal/portal-mobile-nav.tsx
git commit -m "remove Back to site link and fix sign-out redirect in portal nav"
```

---

### Task 9: Fix admin nav sign-out redirects

**Files:**
- Modify: `components/admin/admin-nav.tsx`
- Modify: `components/admin/admin-mobile-nav.tsx`

Note: admin nav already has a working "Patient Portal" link to `/dashboard` — only `redirectUrl="/"` needs updating.

- [ ] **Step 1: Update admin-nav.tsx**

Change `redirectUrl="/"` → `redirectUrl="/sign-in"` on the `<SignOutButton>` (line 59).

- [ ] **Step 2: Update admin-mobile-nav.tsx**

Change `redirectUrl="/"` → `redirectUrl="/sign-in"` on the `<SignOutButton>` (line 74).

- [ ] **Step 3: Commit**

```bash
git add components/admin/admin-nav.tsx components/admin/admin-mobile-nav.tsx
git commit -m "fix admin sign-out redirect to /sign-in"
```

---

### Task 10: Fix booking confirmation "Back to home" link

**Files:**
- Modify: `components/booking/step-confirm.tsx`

The post-booking success screen has `<Link href="/">Back to home</Link>` (line 94). Change it to `/dashboard`.

- [ ] **Step 1: Update the link**

Change:
```tsx
<Link href="/">Back to home</Link>
```
to:
```tsx
<Link href="/dashboard">Back to dashboard</Link>
```

- [ ] **Step 2: Commit**

```bash
git add components/booking/step-confirm.tsx
git commit -m "fix post-booking back link to /dashboard"
```

---

### Task 11: Remove back-links from auth pages

**Files:**
- Modify: `app/sign-in/[[...sign-in]]/page.tsx`
- Modify: `app/sign-up/[[...sign-up]]/page.tsx`

The `← Clinic Name` back-link at the top of each auth page links to `/`, which now redirects to `/sign-in` — a self-referential loop. Remove the link entirely. Also remove the `Link` import if it becomes unused.

- [ ] **Step 1: Update sign-in page**

In `app/sign-in/[[...sign-in]]/page.tsx`, remove:
```tsx
        <Link href="/" className="mb-8 text-sm font-semibold text-foreground hover:opacity-70">
          ← {clinic.name}
        </Link>
```
Also remove the `Link` import from `next/link` if it is no longer used in the file.

- [ ] **Step 2: Update sign-up page**

Read `app/sign-up/[[...sign-up]]/page.tsx` first, then apply the same removal of the `← {clinic.name}` back-link and `Link` import.

- [ ] **Step 3: Commit**

```bash
git add "app/sign-in/[[...sign-in]]/page.tsx" "app/sign-up/[[...sign-up]]/page.tsx"
git commit -m "remove back-to-home links from auth pages"
```

---

## Chunk 3: Verify

### Task 12: Build verification

- [ ] **Step 1: Run a production build**

```bash
node node_modules/next/dist/bin/next build
```

Expected: build completes with no errors. TypeScript and import errors would surface here if any deleted file is still referenced.

- [ ] **Step 2: Verify shared components are gone from disk**

```bash
ls components/shared/ 2>&1
```

Expected: `ls: components/shared: No such file or directory` (directory was emptied and removed) OR the listing shows no `clinic-nav.tsx`, `clinic-footer.tsx`, or `book-button.tsx`.

- [ ] **Step 3: Grep for dead references to deleted files (by file-path fragments AND exported names)**

```bash
grep -r "clinic-nav\|clinic-footer\|book-button\|onboard\|ClinicNav\|ClinicFooter\|BookButton" app components --include="*.tsx" --include="*.ts" -l
```

Expected: no output. These identifiers only ever appeared in the deleted marketing/onboard files.

- [ ] **Step 4: Grep for remaining dead href and redirectUrl links**

```bash
grep -r 'href="/"\|redirectUrl="/"' app components --include="*.tsx" -l
```

Expected: no output. Note: `app/page.tsx` uses `redirect("/sign-in")` (a function call, not an `href` attribute) so it will not appear in this grep — that is correct.

- [ ] **Step 5: Final commit**

If build passes and all greps are clean, the work is done. No additional commit needed — all changes were committed incrementally above.
