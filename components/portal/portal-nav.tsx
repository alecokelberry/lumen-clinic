"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, MessageSquare, FileText, CreditCard, Settings, LayoutDashboard, LogOut } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Messages",     href: "/messages",     icon: MessageSquare },
  { label: "Records",      href: "/records",      icon: FileText },
  { label: "Billing",      href: "/billing",      icon: CreditCard },
  { label: "Settings",     href: "/settings",     icon: Settings },
]

export function PortalNav({ clerkConfigured }: { clerkConfigured: boolean }) {
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
        {clerkConfigured && (
          <SignOutButton redirectUrl="/sign-in">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
              style={{ color: "#64748b" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </SignOutButton>
        )}
      </div>
    </>
  )
}
