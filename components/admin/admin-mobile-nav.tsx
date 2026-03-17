"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, CalendarDays, Users, LayoutDashboard, Settings2, MessageSquare, UserRound, LogOut, ArrowLeft } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
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

export function AdminMobileNav({ clerkConfigured, clinicName }: { clerkConfigured: boolean; clinicName: string }) {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10">
          <Menu className="h-5 w-5" style={{ color: "#f1f5f9" }} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="flex w-64 flex-col p-0" style={{ background: "#0f172a", border: "none" }}>
        {/* Header */}
        <div className="flex h-14 items-center gap-2 px-5" style={{ borderBottom: "1px solid #1e293b" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
            {clinicName}
          </span>
          <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: "#1e3a5f", color: "#93c5fd" }}>
            Admin
          </span>
        </div>

        {/* Nav */}
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

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
            style={{ color: "#64748b" }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Patient Portal
          </Link>
          {clerkConfigured && (
            <SignOutButton redirectUrl="/sign-in">
              <button
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium"
                style={{ color: "#64748b" }}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </SignOutButton>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
