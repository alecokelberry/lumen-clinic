import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { Toaster } from "@/components/ui/sonner"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { X } from "lucide-react"

export default async function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clinic = await getClinic()

  return (
    <ClinicBrandProvider
      primaryColor={clinic.primary_color}
      accentColor={clinic.accent_color ?? "#eff6ff"}
    >
      <div className="min-h-screen" style={{ background: "var(--surface-warm)" }}>
        {/* Minimal booking header */}
        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <Link href="/" className="font-display text-lg font-medium text-foreground hover:opacity-70 transition-opacity">
              {clinic.name}
            </Link>
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Exit booking</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-10 pb-16">{children}</main>
        <Toaster />
      </div>
    </ClinicBrandProvider>
  )
}
