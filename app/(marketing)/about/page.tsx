import { getClinic } from "@/lib/clinic"
import { createServiceClient } from "@/lib/supabase/server"
import { BookButton } from "@/components/shared/book-button"
import { CalendarDays, Heart, MapPin, ShieldCheck, Star, Users } from "lucide-react"
import type { Metadata } from "next"
import type { Provider } from "@/lib/supabase/types"

export const metadata: Metadata = { title: "About" }

const VALUES = [
  {
    icon: Heart,
    title: "Patient-first, always",
    body: "Every decision we make — from how we design our waiting room to how we build our scheduling — starts with the patient experience.",
  },
  {
    icon: ShieldCheck,
    title: "Transparency you can trust",
    body: "Clear pricing, honest timelines, and no surprise bills. We believe healthcare should never feel like a black box.",
  },
  {
    icon: Users,
    title: "A team that listens",
    body: "We hire clinicians who slow down, ask questions, and treat you like a whole person — not a fifteen-minute slot.",
  },
  {
    icon: CalendarDays,
    title: "Respect for your time",
    body: "Online booking, telehealth options, and on-time appointments because your schedule matters as much as your health.",
  },
]

export default async function AboutPage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from("providers")
    .select("id, name, title, photo_url, specialties")
    .eq("clinic_id", clinic.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(4)

  const providers = (data ?? []) as Pick<Provider, "id" | "name" | "title" | "photo_url" | "specialties">[]

  return (
    <>
      {/* Page header */}
      <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="font-bold text-slate-900" style={{ fontSize: "2rem", letterSpacing: "-0.02em" }}>
            About {clinic.name}
          </h1>
          <p className="mt-2 text-slate-500" style={{ maxWidth: "520px" }}>
            Built on a simple belief: that seeing a specialist shouldn&apos;t require three phone calls,
            a fax machine, and a six-week wait.
          </p>
        </div>
      </div>

      {/* Stats */}
      <section style={{ borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { value: "4",     label: "Specialists" },
              { value: "5★",    label: "Average rating" },
              { value: "48 hr", label: "Avg. wait for appt." },
              { value: "100%",  label: "Online booking" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-bold" style={{ fontSize: "2rem", letterSpacing: "-0.02em", color: "var(--clinic-primary)" }}>
                  {value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="font-bold text-slate-900" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
                Our mission
              </h2>
              <p className="mt-4 leading-relaxed text-slate-500">
                We exist to make specialty care accessible — not just geographically, but emotionally.
                Too many patients avoid getting help because the process feels overwhelming. We&apos;ve rebuilt
                the experience from scratch: clear scheduling, honest communication, and clinicians who
                have time to care.
              </p>
              <p className="mt-4 leading-relaxed text-slate-500">
                Whether you&apos;re booking your first visit or managing a long-term condition,{" "}
                {clinic.name} is designed to feel less like a system and more like a relationship.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Star,       label: "5-star care" },
                { icon: MapPin,     label: "Salt Lake City" },
                { icon: ShieldCheck, label: "HIPAA secure" },
                { icon: Heart,      label: "Patient-centered" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border p-6 text-center"
                  style={{ borderColor: "#e2e8f0", background: "#ffffff" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "var(--clinic-primary)" }} />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ borderBottom: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-10 font-bold text-slate-900" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            What we stand for
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 rounded-xl border p-6"
                style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--clinic-accent)" }}>
                  <Icon className="h-5 w-5" style={{ color: "var(--clinic-primary)" }} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      {providers.length > 0 && (
        <section style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="mb-10 font-bold text-slate-900" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
              Meet the team
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {providers.map((provider) => {
                const initials = provider.name.split(" ").filter(p => !p.endsWith(".")).slice(0, 2).map(n => n[0]).join("")
                return (
                  <div key={provider.id} className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
                    <div className="flex aspect-square items-center justify-center" style={{ background: "#f1f5f9" }}>
                      {provider.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={provider.photo_url} alt={provider.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-4xl font-bold" style={{ color: "var(--clinic-primary)", opacity: 0.2 }}>
                          {initials}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-slate-900">{provider.name}</p>
                      {provider.title && (
                        <p className="text-sm text-slate-500">{provider.title}</p>
                      )}
                      {provider.specialties.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {provider.specialties.slice(0, 2).map((s) => (
                            <span key={s} className="rounded-full border px-2 py-0.5 text-xs font-medium"
                              style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#2563eb" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: "linear-gradient(160deg, #eef2ff 0%, #ffffff 100%)" }}>
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-bold text-slate-900" style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}>
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-slate-500">
            Book online in under a minute. No referral needed.
          </p>
          <BookButton size="lg" className="mt-7" />
        </div>
      </section>
    </>
  )
}
