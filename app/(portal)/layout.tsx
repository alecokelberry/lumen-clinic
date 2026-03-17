import { redirect } from "next/navigation"
import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import { PortalNav } from "@/components/portal/portal-nav"
import { PortalMobileNav } from "@/components/portal/portal-mobile-nav"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (clerkConfigured) {
    const { auth } = await import("@clerk/nextjs/server")
    const { userId } = await auth()
    if (!userId) redirect("/sign-in")
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
          <div className="flex h-14 items-center gap-2 px-5" style={{ borderBottom: "1px solid #1e293b" }}>
            <Link href="/dashboard" className="transition-opacity hover:opacity-70">
              <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
                {clinic.name}
              </span>
            </Link>
          </div>
          <PortalNav clerkConfigured={clerkConfigured} />
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile top bar */}
          <header
            className="flex h-14 items-center gap-3 px-4 md:hidden"
            style={{ background: "#0f172a", borderBottom: "1px solid #1e293b" }}
          >
            <PortalMobileNav clerkConfigured={clerkConfigured} clinicName={clinic.name} />
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
