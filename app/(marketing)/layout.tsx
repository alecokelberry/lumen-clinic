import { getClinic } from "@/lib/clinic"
import { ClinicNav } from "@/components/shared/clinic-nav"
import { ClinicFooter } from "@/components/shared/clinic-footer"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { StickyBookBar } from "@/components/shared/book-button"
import { Toaster } from "@/components/ui/sonner"

export default async function MarketingLayout({
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
      <ClinicNav clinic={clinic} />
      <main className="pb-20 md:pb-0">{children}</main>
      <ClinicFooter clinic={clinic} />
      <StickyBookBar />
      <Toaster />
    </ClinicBrandProvider>
  )
}
