import { redirect } from "next/navigation"
import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import { PortalNav } from "@/components/portal/portal-nav"

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Enforce auth when Clerk is configured
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
      <div className="flex min-h-screen bg-muted/20">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-background md:flex">
          <div className="flex h-14 items-center border-b border-border/60 px-4">
            <Link href="/" className="text-sm font-semibold text-foreground hover:opacity-70">
              {clinic.name}
            </Link>
          </div>
          <PortalNav clerkConfigured={clerkConfigured} />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex h-14 items-center justify-between border-b border-border/60 bg-background px-4 md:hidden">
            <Link href="/" className="text-sm font-semibold text-foreground">
              {clinic.name}
            </Link>
          </header>
          <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
      <Toaster />
    </ClinicBrandProvider>
  )
}
