import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { BookButton } from "@/components/shared/book-button"
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
    <>
      {/* Page header */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="font-bold text-slate-900" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
            Our services
          </h1>
          <p className="mt-2 text-slate-500">
            Real online booking for every service — no phone calls required.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {groups.map(({ label, items }) => (
          <section key={label} className="mb-12">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((service) => (
                <div
                  key={service.id}
                  className="flex flex-col rounded-xl border bg-white p-5"
                  style={{ borderColor: "#e2e8f0" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    {service.is_virtual && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                        style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#2563eb" }}>
                        <Video className="h-3 w-3" /> Virtual
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {service.duration_min} min
                    </span>
                    <Button
                      asChild
                      size="sm"
                      className="text-white hover:opacity-90"
                      style={{ background: "var(--clinic-primary)" }}
                    >
                      <Link href={`/book?service=${service.id}`}>Book</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Not sure CTA */}
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "#bfdbfe", background: "#eff6ff" }}>
          <h3 className="font-semibold text-slate-900">Not sure which service you need?</h3>
          <p className="mt-2 text-sm text-slate-500">
            Book a New Patient Visit and let your provider guide the way.
          </p>
          <BookButton size="default" className="mt-5" label="Book a New Patient Visit" />
        </div>
      </div>
    </>
  )
}
