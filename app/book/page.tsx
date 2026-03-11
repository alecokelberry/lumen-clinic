import { Suspense } from "react"
import { BookingWizard } from "@/components/booking/booking-wizard"
import { Skeleton } from "@/components/ui/skeleton"
import { createServiceClient } from "@/lib/supabase/server"
import { getClinic } from "@/lib/clinic"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Book Appointment" }

export type BookingService = {
  id: string
  name: string
  description: string | null
  duration_min: number
  is_virtual: boolean
}

export type BookingProvider = {
  id: string
  name: string
  title: string
}

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; provider?: string; date?: string; step?: string }>
}) {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: servicesData }, { data: providersData }] = await Promise.all([
    (supabase as any)
      .from("services")
      .select("id, name, description, duration_min, is_virtual")
      .eq("clinic_id", clinic.id)
      .order("name"),
    (supabase as any)
      .from("providers")
      .select("id, name, title")
      .eq("clinic_id", clinic.id)
      .order("name"),
  ])

  const services = (servicesData ?? []) as BookingService[]
  const providers = (providersData ?? []) as BookingProvider[]

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <BookingWizard
        searchParams={searchParams}
        services={services}
        providers={providers}
        clinicId={clinic.id}
      />
    </Suspense>
  )
}
