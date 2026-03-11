import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { BookButton } from "@/components/shared/book-button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Video } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import type { Service } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "Services" }

export default async function ServicesPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const services = (data ?? []) as Service[]
  const inPerson = services.filter((s) => !s.is_virtual)
  const telehealth = services.filter((s) => s.is_virtual)

  const groups = [
    { label: "In-Person Visits", items: inPerson },
    { label: "Telehealth", items: telehealth },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
      <div className="mb-12 max-w-xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Services
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Everything you need, in one place — with real online booking for every service.
        </p>
      </div>

      {groups.map(({ label, items }) => (
        <section key={label} className="mb-12">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((service) => (
              <Card
                key={service.id}
                className="border border-border/60 transition-shadow hover:shadow-sm"
              >
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start gap-2">
                    <p className="flex-1 font-medium text-foreground">{service.name}</p>
                    {service.is_virtual && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 border-[var(--clinic-primary)]/20 bg-[var(--clinic-accent)] text-[var(--clinic-primary)] text-xs"
                      >
                        <Video className="mr-1 h-3 w-3" />
                        Virtual
                      </Badge>
                    )}
                  </div>
                  {service.description && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration_min} min
                    </span>
                    <Button
                      asChild
                      size="sm"
                      className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
                    >
                      <Link href={`/book?service=${service.id}`}>Book</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-8 rounded-xl border border-[var(--clinic-primary)]/20 bg-[var(--clinic-accent)] p-8 text-center">
        <h3 className="text-lg font-semibold text-foreground">Not sure which service you need?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Book a New Patient Visit and let your provider guide the way.
        </p>
        <BookButton size="default" className="mt-5" label="Book a New Patient Visit" />
      </div>
    </div>
  )
}
