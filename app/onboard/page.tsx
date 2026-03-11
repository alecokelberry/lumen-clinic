import { OnboardWizard } from "./onboard-wizard"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import { Toaster } from "@/components/ui/sonner"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get started — Lumen Clinic",
  description: "Set up your clinic on Lumen in under 5 minutes.",
}

export default function OnboardPage() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "lumenclinic.health"

  return (
    <ClinicBrandProvider primaryColor="#2563eb" accentColor="#eff6ff">
      <OnboardWizard rootDomain={rootDomain} />
      <Toaster />
    </ClinicBrandProvider>
  )
}
