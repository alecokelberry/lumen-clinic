"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, CalendarDays, MessageSquare, FileText, CreditCard, Settings, LayoutDashboard, LogOut } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
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

export function PortalMobileNav({ clerkConfigured, clinicName }: { clerkConfigured: boolean; clinicName: string }) {
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
        <div className="flex h-14 items-center px-5" style={{ borderBottom: "1px solid #1e293b" }}>
          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#f1f5f9", letterSpacing: "-0.01em" }}>
            {clinicName}
          </span>
        </div>

        {/* Nav */}
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

        {/* Footer */}
        <div className="p-3" style={{ borderTop: "1px solid #1e293b" }}>
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
