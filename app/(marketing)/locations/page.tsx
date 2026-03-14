import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { BookButton } from "@/components/shared/book-button"
import { Clock, MapPin, Phone } from "lucide-react"
import type { Metadata } from "next"
import type { Location } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Locations" }

const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu",
  fri: "Fri", sat: "Sat", sun: "Sun",
}
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

function formatHours(hours: Record<string, string>) {
  return DAY_ORDER.map((key) => ({
    day: DAY_LABELS[key] ?? key,
    hours: hours[key] ?? "Closed",
  }))
}

export default async function LocationsPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from("locations")
    .select("*")
    .eq("clinic_id", clinic.id)
    .order("created_at", { ascending: true })

  const locations = (data ?? []) as Location[]

  return (
    <>
      {/* Page header */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="font-bold text-slate-900" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
            Locations
          </h1>
          <p className="mt-2 text-slate-500">
            {locations.length > 1
              ? `${locations.length} convenient locations. Your records are always in sync.`
              : "Convenient care, close to home."}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {locations.length === 0 ? (
          <p className="text-slate-500">No locations listed yet.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {locations.map((loc, idx) => {
              const hours = formatHours((loc.hours as Record<string, string>) ?? {})
              return (
                <div key={loc.id} className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
                  {/* Map placeholder */}
                  <div className="relative flex h-44 items-center justify-center" style={{ background: "#f1f5f9" }}>
                    <MapPin className="h-10 w-10" style={{ color: "var(--clinic-primary)", opacity: 0.2 }} />
                    {idx === 0 && locations.length > 1 && (
                      <span
                        className="absolute left-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                        style={{ background: "var(--clinic-primary)" }}
                      >
                        Main Location
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h2 className="font-semibold text-slate-900">{loc.name}</h2>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-slate-500">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--clinic-primary)" }} />
                        <p>{loc.address}</p>
                      </div>
                      {loc.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Phone className="h-4 w-4 shrink-0" style={{ color: "var(--clinic-primary)" }} />
                          <a href={`tel:${loc.phone}`} className="hover:text-slate-900 transition-colors">
                            {loc.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        Hours
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {hours.map(({ day, hours: h }) => (
                          <div key={day} className="flex justify-between">
                            <span className="text-slate-500">{day}</span>
                            <span className={h === "Closed" ? "text-slate-300" : "font-medium text-slate-700"}>
                              {h}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <BookButton
                        label={`Book at ${loc.name.split(" ")[0]}`}
                        className="w-full justify-center"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-slate-400">
          For medical emergencies, call{" "}
          <strong className="text-slate-700">911</strong> or visit your nearest emergency room.
        </p>
      </div>
    </>
  )
}
