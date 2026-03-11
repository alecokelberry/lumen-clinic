"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@clerk/nextjs"
import { CalendarDays, Users, LayoutDashboard, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Bookings", href: "/admin", icon: CalendarDays },
  { label: "Providers", href: "/admin/providers", icon: Users },
  { label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
]

export function AdminNav({ clerkConfigured }: { clerkConfigured: boolean }) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/admin"
          ? pathname === "/admin"
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors sm:flex",
              isActive
                ? "bg-[var(--clinic-accent)] font-medium text-[var(--clinic-primary)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        )
      })}

      {clerkConfigured && (
        <SignOutButton redirectUrl="/">
          <button className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </SignOutButton>
      )}
    </div>
  )
}
