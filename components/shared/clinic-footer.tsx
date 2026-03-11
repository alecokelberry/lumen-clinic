import Link from "next/link"
import type { Clinic } from "@/lib/supabase/types"

interface ClinicFooterProps {
  clinic: Clinic
}

export function ClinicFooter({ clinic }: ClinicFooterProps) {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold text-foreground">{clinic.name}</p>
            {clinic.tagline && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {clinic.tagline}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Visit
            </p>
            <nav className="flex flex-col gap-2">
              {["Services", "Providers", "Locations", "About"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Patient */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Patients
            </p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Book Appointment", href: "/book" },
                { label: "Patient Portal", href: "/dashboard" },
                { label: "Pay My Bill", href: "/billing" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Use", href: "/terms" },
                { label: "HIPAA Notice", href: "/hipaa" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {clinic.name}. All rights reserved.{" "}
          <span className="opacity-50">Powered by Lumen</span>
        </div>
      </div>
    </footer>
  )
}
