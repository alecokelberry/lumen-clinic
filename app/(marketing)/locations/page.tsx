import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { BookButton } from "@/components/shared/book-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mb-12 max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Locations
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {locations.length > 1
            ? `${locations.length} convenient locations. Same great team. Your records are always in sync.`
            : "Convenient care, close to home."}
        </p>
      </div>

      {locations.length === 0 ? (
        <p className="text-muted-foreground">No locations listed yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {locations.map((loc, idx) => {
            const hours = formatHours((loc.hours as Record<string, string>) ?? {})
            return (
              <Card key={loc.id} className="overflow-hidden border border-border/60">
                {/* Map placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-[var(--clinic-accent)] to-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-10 w-10 text-[var(--clinic-primary)]/40" />
                  </div>
                  {idx === 0 && locations.length > 1 && (
                    <Badge className="absolute left-4 top-4 bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)]">
                      Main Location
                    </Badge>
                  )}
                </div>

                <CardContent className="p-5">
                  <h2 className="text-lg font-semibold text-foreground">{loc.name}</h2>

                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinic-primary)]" />
                      <p>{loc.address}</p>
                    </div>
                    {loc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-[var(--clinic-primary)]" />
                        <a href={`tel:${loc.phone}`} className="hover:text-foreground">
                          {loc.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Hours
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {hours.map(({ day, hours: h }) => (
                        <div key={day} className="flex justify-between">
                          <span className="text-muted-foreground">{day}</span>
                          <span className={h === "Closed" ? "text-muted-foreground/50" : "text-foreground"}>
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        For medical emergencies, call{" "}
        <strong className="text-foreground">911</strong> or visit your nearest emergency room.
      </p>
    </div>
  )
}
