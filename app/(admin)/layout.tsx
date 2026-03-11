import { redirect } from "next/navigation"
import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import { LayoutDashboard, CalendarDays, Users, Settings2 } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export const NAV_ITEMS = [
  { label: "Bookings", href: "/admin", icon: CalendarDays },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { label: "Settings", href: "/admin/settings", icon: Settings2 },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (clerkConfigured) {
    await import("@/lib/require-admin").then((m) => m.requireAdmin())
  }

  const clinic = await getClinic()

  return (
    <ClinicBrandProvider
      primaryColor={clinic.primary_color}
      accentColor={clinic.accent_color ?? "#eff6ff"}
    >
      <div className="flex min-h-screen flex-col bg-muted/20">
        {/* Top bar */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm font-semibold text-foreground hover:opacity-70">
                {clinic.name}
              </Link>
              <span className="rounded-md bg-[var(--clinic-accent)] px-2 py-0.5 text-xs font-medium text-[var(--clinic-primary)]">
                Admin
              </span>
            </div>
            <AdminNav clerkConfigured={clerkConfigured} />
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
          {children}
        </main>
      </div>
      <Toaster />
    </ClinicBrandProvider>
  )
}
