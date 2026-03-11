"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, MessageSquare, FileText, CreditCard, Settings, LayoutDashboard, LogOut } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Records", href: "/records", icon: FileText },
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function PortalNav({ clerkConfigured }: { clerkConfigured: boolean }) {
  const pathname = usePathname()

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[var(--clinic-accent)] font-medium text-[var(--clinic-primary)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {clerkConfigured && (
        <div className="border-t border-border/60 p-3">
          <SignOutButton redirectUrl="/">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </SignOutButton>
        </div>
      )}
    </>
  )
}
