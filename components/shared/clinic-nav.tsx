import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, LayoutDashboard, Menu } from "lucide-react"
import type { Clinic } from "@/lib/supabase/types"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { currentUser } from "@clerk/nextjs/server"

interface ClinicNavProps {
  clinic: Clinic
}

const NAV_ITEMS = [
  { label: "Services",  href: "/services" },
  { label: "Providers", href: "/providers" },
  { label: "Locations", href: "/locations" },
  { label: "About",     href: "/about" },
]

export async function ClinicNav({ clinic }: ClinicNavProps) {
  const user = await currentUser()
  const isAdmin = (user?.publicMetadata as { role?: string })?.role === "admin"

  return (
    <header className="sticky top-0 z-50 w-full" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">

        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 flex flex-col p-0">
              {/* Header */}
              <div className="flex h-14 items-center border-b px-4" style={{ borderColor: "#e2e8f0" }}>
                <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0f172a" }}>{clinic.name}</span>
              </div>

              {/* Nav */}
              <div className="flex flex-1 flex-col p-3">
                <nav className="flex flex-col gap-0.5">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
                      style={{ color: "#0f172a" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {(user || isAdmin) && (
                  <div className="mt-2 flex flex-col gap-0.5 border-t pt-2" style={{ borderColor: "#f1f5f9" }}>
                    {user && (
                      <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50" style={{ color: "#64748b" }}>
                        Patient Portal
                      </Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-50" style={{ color: "#64748b" }}>
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="p-4 border-t" style={{ borderColor: "#e2e8f0" }}>
                <Link
                  href="/book"
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--clinic-primary)" }}
                >
                  <CalendarDays className="h-4 w-4" />
                  Book Appointment
                </Link>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-70">
            {clinic.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clinic.logo_url} alt={clinic.name} className="h-7 w-auto" />
            ) : (
              <span style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.01em", color: "#0f172a" }}>
                {clinic.name}
              </span>
            )}
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
              style={{ color: "#475569" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right actions (desktop only) */}
        <div className="hidden items-center gap-1.5 md:flex">
          {user && (
            <Link
              href="/dashboard"
              className="rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
              style={{ color: "#475569" }}
            >
              Portal
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-slate-50"
              style={{ color: "#475569" }}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
          <Link
            href="/book"
            className="ml-1 flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--clinic-primary)" }}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Book now
          </Link>
        </div>

      </div>
    </header>
  )
}
