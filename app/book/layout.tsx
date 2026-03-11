import Link from "next/link"
import { getClinic } from "@/lib/clinic"
import { Toaster } from "@/components/ui/sonner"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      <div className="min-h-screen bg-background">
        {/* Minimal booking header */}
        <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link href="/" className="text-sm font-semibold text-foreground">
              {clinic.name}
            </Link>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <X className="h-4 w-4" />
                <span className="sr-only">Exit booking</span>
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
        <Toaster />
      </div>
    </ClinicBrandProvider>
  )
}
