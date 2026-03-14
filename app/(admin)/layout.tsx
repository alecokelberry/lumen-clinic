import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import { CalendarDays, Users, LayoutDashboard, Settings2, MessageSquare, UserRound } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export const NAV_ITEMS = [
  { label: "Bookings",  href: "/admin",           icon: CalendarDays },
  { label: "Messages",  href: "/admin/messages",  icon: MessageSquare },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Patients",  href: "/admin/patients",  icon: UserRound },
  { label: "Overview",  href: "/admin/overview",  icon: LayoutDashboard },
  { label: "Settings",  href: "/admin/settings",  icon: Settings2 },
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
      <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
        {/* Sidebar */}
        <aside
          className="hidden w-56 shrink-0 flex-col md:flex"
          style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}
        >
          {/* Brand */}
          <div className="flex h-14 items-center gap-2 px-5" style={{ borderBottom: "1px solid #1e293b" }}>
            <Link href="/" className="transition-opacity hover:opacity-70">
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                {clinic.name}
              </span>
            </Link>
            <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
              Admin
            </span>
          </div>

          <AdminNav clerkConfigured={clerkConfigured} />
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile top bar */}
          <header
            className="flex h-14 items-center gap-3 px-4 md:hidden"
            style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}
          >
            <AdminMobileNav clerkConfigured={clerkConfigured} clinicName={clinic.name} />
            <div className="flex items-center gap-2">
              <Link href="/">
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
