import { notFound } from "next/navigation"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import { ChevronLeft } from "lucide-react"
import { ScheduleEditor } from "./schedule-editor"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Admin — Provider Schedule" }

type Props = { params: Promise<{ id: string }> }

export default async function ProviderSchedulePage({ params }: Props) {
  const { id } = await params
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // Fetch provider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, title")
    .eq("id", id)
    .eq("clinic_id", clinic.id)
    .single()

  if (!provider) notFound()

  const prov = provider as { id: string; name: string; title: string | null }

  // Fetch existing schedules
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schedules } = await supabase
    .from("provider_schedules")
    .select("day_of_week, start_time, end_time, slot_duration_min")
    .eq("provider_id", id)

  // Resolve location (use clinic's first location as default)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("clinic_id", clinic.id)
    .limit(1)
    .single()

  const locationId = (location as { id: string } | null)?.id ?? ""

  type ScheduleRow = {
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_min: number
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/admin/providers"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Providers
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{prov.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {prov.title ? `${prov.title} · ` : ""}Weekly availability schedule
        </p>
      </div>

      <ScheduleEditor
        providerId={prov.id}
        locationId={locationId}
        existing={(schedules ?? []) as ScheduleRow[]}
      />
    </div>
  )
}
