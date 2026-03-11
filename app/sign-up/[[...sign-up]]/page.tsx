import { SignUp } from "@clerk/nextjs"
import { getClinic } from "@/lib/clinic"
import { ClinicBrandProvider } from "@/components/clinic-brand-provider"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Create Account" }

export default async function SignUpPage() {
  const clinic = await getClinic()

  return (
    <ClinicBrandProvider
      primaryColor={clinic.primary_color}
      accentColor={clinic.accent_color ?? "#eff6ff"}
    >
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 px-4 py-12">
        <Link href="/" className="mb-8 text-sm font-semibold text-foreground hover:opacity-70">
          ← {clinic.name}
        </Link>
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-sm border border-border/60 rounded-2xl",
              headerTitle: "text-xl font-bold",
              formButtonPrimary:
                "bg-[var(--clinic-primary)] hover:opacity-90 text-white rounded-lg",
              footerActionLink: "text-[var(--clinic-primary)]",
            },
          }}
        />
      </div>
    </ClinicBrandProvider>
  )
}
