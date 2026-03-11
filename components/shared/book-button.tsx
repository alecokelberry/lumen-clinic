"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookButtonProps {
  className?: string
  size?: "sm" | "default" | "lg"
  label?: string
}

/**
 * The always-visible "Book Appointment" CTA.
 * Also renders a sticky mobile bottom bar when on marketing pages.
 */
export function BookButton({
  className,
  size = "default",
  label = "Book Appointment",
}: BookButtonProps) {
  return (
    <Button
      asChild
      size={size}
      className={cn(
        "bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] shadow-sm hover:opacity-90 transition-opacity",
        className
      )}
    >
      <Link href="/book">
        <CalendarDays className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
}

/** Sticky bottom bar for mobile — always visible on marketing pages */
export function StickyBookBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
      <BookButton size="default" className="w-full" />
    </div>
  )
}
