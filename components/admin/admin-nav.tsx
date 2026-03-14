"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@clerk/nextjs"
import { LogOut, CalendarDays, Users, LayoutDashboard, Settings2, MessageSquare, UserRound, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Bookings",  href: "/admin",           icon: CalendarDays },
  { label: "Messages",  href: "/admin/messages",  icon: MessageSquare },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Patients",  href: "/admin/patients",  icon: UserRound },
  { label: "Overview",  href: "/admin/overview",  icon: LayoutDashboard },
  { label: "Settings",  href: "/admin/settings",  icon: Settings2 },
]

export function AdminNav({ clerkConfigured }: { clerkConfigured: boolean }) {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
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
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: "#64748b" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#94a3b8" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#64748b" }}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Patient Portal
        </Link>
        {clerkConfigured && (
          <SignOutButton redirectUrl="/">
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
