import Link from "next/link"
import type { Clinic } from "@/lib/supabase/types"

interface ClinicFooterProps {
  clinic: Clinic
}

export function ClinicFooter({ clinic }: ClinicFooterProps) {
  return (
    <footer style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
      <div className="mx-auto max-w-6xl px-6" style={{ paddingTop: "3.75rem", paddingBottom: "2rem" }}>
        <div className="grid gap-6 md:grid-cols-[2fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0f172a", letterSpacing: "-0.01em" }}>
              {clinic.name}
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "#64748b" }}>
              Modern specialty care with online booking, secure messaging, and a patient portal — all in one place.
            </p>
          </div>

          {/* Visit */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Visit</p>
            <nav className="flex flex-col gap-2">
              {["Services", "Providers", "Locations", "About"].map((item) => (
                <Link key={item} href={`/${item.toLowerCase()}`}
                  className="text-sm transition-colors hover:text-slate-900" style={{ color: "#64748b" }}>
                  {item}
                </Link>
              ))}
            </nav>
          </div>

          {/* Patients */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Patients</p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Book Appointment", href: "/book" },
                { label: "Patient Portal",   href: "/dashboard" },
                { label: "Pay My Bill",      href: "/billing" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="text-sm transition-colors hover:text-slate-900" style={{ color: "#64748b" }}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Legal</p>
            <nav className="flex flex-col gap-2">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Use",   href: "/terms" },
                { label: "HIPAA Notice",   href: "/hipaa" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="text-sm transition-colors hover:text-slate-900" style={{ color: "#64748b" }}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t sm:flex-row" style={{ borderColor: "#e2e8f0", paddingTop: "1.25rem", paddingBottom: "0.5rem" }}>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            © {new Date().getFullYear()} {clinic.name}. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "#cbd5e1" }}>Powered by Lumen</p>
        </div>
      </div>
    </footer>
  )
}
