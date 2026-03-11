import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, Menu } from "lucide-react"
import type { Clinic } from "@/lib/supabase/types"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

interface ClinicNavProps {
  clinic: Clinic
}

const NAV_ITEMS = [
  { label: "Services", href: "/services" },
  { label: "Providers", href: "/providers" },
  { label: "Locations", href: "/locations" },
  { label: "About", href: "/about" },
]

export function ClinicNav({ clinic }: ClinicNavProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          {clinic.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={clinic.logo_url} alt={clinic.name} className="h-8 w-auto" />
          ) : (
            <span className="text-lg font-semibold tracking-tight text-foreground">
              {clinic.name}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            size="sm"
            className="hidden bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90 md:inline-flex"
          >
            <Link href="/book">
              <CalendarDays className="mr-2 h-4 w-4" />
              Book Appointment
            </Link>
          </Button>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="mt-8 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-base font-medium text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button
                  asChild
                  className="mt-4 bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)]"
                >
                  <Link href="/book">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
