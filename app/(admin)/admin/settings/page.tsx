import { getClinic } from "@/lib/clinic"
import { SettingsForm } from "./settings-form"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Settings" }

export default async function AdminSettingsPage() {
  const clinic = await getClinic()

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage branding and identity for {clinic.name}.
        </p>
      </div>

      <SettingsForm
        clinicId={clinic.id}
        initialName={clinic.name}
        initialTagline={clinic.tagline ?? ""}
        initialPrimary={clinic.primary_color}
        initialAccent={clinic.accent_color ?? "#eff6ff"}
        initialTimezone={clinic.timezone ?? "America/New_York"}
      />
    </div>
  )
}
