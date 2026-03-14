import { getClinic } from "@/lib/clinic"
import { BookButton } from "@/components/shared/book-button"
import { Button } from "@/components/ui/button"
import { CalendarDays, MessageSquare, ShieldCheck, Star, Video, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createServiceClient } from "@/lib/supabase/server"
import type { Service, Provider } from "@/lib/supabase/types"

const TESTIMONIALS = [
  { name: "Jennifer K.", text: "Booking online was effortless — I was seen within 48 hours. The team is incredibly kind.", rating: 5, role: "Patient since 2024" },
  { name: "Tom R.", text: "Finally a doctor's office that doesn't require faxing my insurance card. Everything was handled digitally.", rating: 5, role: "Patient since 2023" },
  { name: "Maria S.", text: "The telehealth option was a lifesaver. Same quality of care, no commute required.", rating: 5, role: "Patient since 2024" },
]

const WHY_ITEMS = [
  { icon: CalendarDays, title: "Book in 60 seconds", body: "Real-time availability. No phone calls, no hold music. Instant confirmation sent to your inbox." },
  { icon: MessageSquare, title: "Secure messaging",  body: "Message your care team directly. Get results, ask follow-up questions — no phone tag, ever." },
  { icon: ShieldCheck,   title: "HIPAA compliant",   body: "Enterprise-grade security protects every message, record, and appointment in your account." },
]

export default async function HomePage() {
  const clinic = await getClinic()
  const supabase = await createServiceClient()

  const [{ data: servicesData }, { data: providersData }] = await Promise.all([
    supabase.from("services").select("*").eq("clinic_id", clinic.id).eq("is_active", true).order("sort_order").limit(6),
    supabase.from("providers").select("id, name, title, photo_url, specialties").eq("clinic_id", clinic.id).eq("is_active", true).order("created_at").limit(3),
  ])

  const services  = (servicesData  ?? []) as Service[]
  const providers = (providersData ?? []) as Pick<Provider, "id" | "name" | "title" | "photo_url" | "specialties">[]

  const heroHeadline = (clinic.tagline && clinic.tagline !== "Compassionate care — close to home.")
    ? clinic.tagline
    : "Your health, handled with expertise."

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(160deg, #eef2ff 0%, #ffffff 50%)" }}>
        <div className="mx-auto max-w-6xl px-6" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>

            {/* Copy */}
            <div>
              <h1
                className="font-bold text-slate-900"
                style={{ fontSize: "clamp(2.25rem, 3.5vw + 0.5rem, 3rem)", lineHeight: 1.1, letterSpacing: "-0.025em" }}
              >
                {heroHeadline}
              </h1>

              <p className="mt-5 leading-relaxed text-slate-500" style={{ fontSize: "1.0625rem" }}>
                Book in minutes. No phone calls, no paperwork surprises. Specialists who take time to listen — on your schedule.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <BookButton size="lg" />
                <Button variant="ghost" size="lg" asChild className="gap-2 text-slate-600">
                  <Link href="/providers">
                    Meet our providers
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-5">
                {[
                  { icon: CalendarDays, text: "Same-week appointments" },
                  { icon: Video,        text: "Telehealth available" },
                  { icon: ShieldCheck,  text: "HIPAA compliant" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Icon className="h-4 w-4" style={{ color: "var(--clinic-primary)" }} />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {[
                { value: "48 hr",  label: "Average wait time",      sub: "For new patient visits" },
                { value: "5.0★",   label: "Patient rating",         sub: "Based on 2,000+ reviews" },
                { value: "100%",   label: "Online booking",         sub: "No phone calls needed" },
                { value: "Same week", label: "Appointments available", sub: "Book as soon as this week" },
              ].map(({ value, label, sub }) => (
                <div key={label} className="rounded-xl border bg-white p-6" style={{ borderColor: "#e2e8f0" }}>
                  <p className="font-bold" style={{ fontSize: "1.75rem", letterSpacing: "-0.03em", color: "var(--clinic-primary)" }}>
                    {value}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{sub}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clinic-primary)" }}>What we offer</p>
              <h2 className="font-bold text-slate-900" style={{ fontSize: "clamp(1.5rem, 2vw + 0.5rem, 2rem)", letterSpacing: "-0.02em" }}>
                Everything you need, in one place
              </h2>
            </div>
            <Link
              href="/services"
              className="hidden items-center gap-1 text-sm font-medium transition-colors hover:text-slate-900 md:flex"
              style={{ color: "var(--clinic-primary)" }}
            >
              All services <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/book?service=${service.id}`}
                className="card-lift group flex flex-col rounded-xl border bg-white p-5 transition-colors hover:border-blue-200"
                style={{ borderColor: "#e2e8f0" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900" style={{ fontSize: "0.9375rem" }}>
                      {service.name}
                    </p>
                    {service.is_virtual && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--clinic-primary)" }}>
                        <Video className="h-3 w-3" /> Virtual
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-slate-500" style={{ borderColor: "#e2e8f0", whiteSpace: "nowrap" }}>
                    {service.duration_min} min
                  </span>
                </div>
                {service.description && (
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500 line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--clinic-primary)" }}>
                  Book now <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Providers ────────────────────────────────────────────────────── */}
      {providers.length > 0 && (
        <section style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clinic-primary)" }}>Your care team</p>
                <h2 className="font-bold text-slate-900" style={{ fontSize: "clamp(1.5rem, 2vw + 0.5rem, 2rem)", letterSpacing: "-0.02em" }}>
                  Specialists who take time to listen
                </h2>
              </div>
              <Link
                href="/providers"
                className="hidden items-center gap-1 text-sm font-medium transition-colors hover:text-slate-900 md:flex"
                style={{ color: "var(--clinic-primary)" }}
              >
                All providers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {providers.map((provider) => {
                const initials = provider.name.split(" ").filter(p => !p.endsWith(".")).slice(0, 2).map(n => n[0]).join("")
                const firstName = provider.name.split(" ").find(p => !p.endsWith(".")) ?? provider.name
                return (
                  <div key={provider.id} className="card-lift group">
                    <Link href={`/book?provider=${provider.id}`} className="block overflow-hidden rounded-xl border bg-white" style={{ borderColor: "#e2e8f0" }}>
                      <div className="relative flex h-48 items-center justify-center" style={{ background: "#f1f5f9" }}>
                        {provider.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={provider.photo_url} alt={provider.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-5xl font-bold" style={{ color: "var(--clinic-primary)", opacity: 0.15 }}>
                            {initials}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <p className="font-semibold text-slate-900">{provider.name}</p>
                        {provider.title && <p className="mt-0.5 text-sm text-slate-500">{provider.title}</p>}
                        {provider.specialties.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {provider.specialties.slice(0, 2).map((s) => (
                              <span key={s} className="rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: "#bfdbfe", background: "var(--clinic-accent)", color: "var(--clinic-primary)" }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-4 flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--clinic-primary)" }}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          Book with {firstName}
                          <ArrowRight className="h-3 w-3" />
                        </p>
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Why ──────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clinic-primary)" }}>Why patients choose us</p>
            <h2 className="font-bold text-slate-900" style={{ fontSize: "clamp(1.5rem, 2vw + 0.5rem, 2rem)", letterSpacing: "-0.02em" }}>
              A better way to get seen
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {WHY_ITEMS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border bg-white p-6" style={{ borderColor: "#e2e8f0" }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--clinic-accent)" }}>
                  <Icon className="h-5 w-5" style={{ color: "var(--clinic-primary)" }} />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-10 text-center">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--clinic-primary)" }}>Patient stories</p>
            <h2 className="font-bold text-slate-900" style={{ fontSize: "clamp(1.5rem, 2vw + 0.5rem, 2rem)", letterSpacing: "-0.02em" }}>
              What patients say
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="flex flex-col rounded-xl border bg-white p-6" style={{ borderColor: "#e2e8f0" }}>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-5 border-t pt-4" style={{ borderColor: "#f1f5f9" }}>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #e2e8f0", background: "linear-gradient(160deg, #eef2ff 0%, #ffffff 100%)" }}>
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="font-bold text-slate-900" style={{ fontSize: "clamp(1.75rem, 2.5vw + 0.5rem, 2.5rem)", letterSpacing: "-0.02em" }}>
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-slate-500">
            Book online in under a minute. No referral needed.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <BookButton size="lg" />
            <Button variant="outline" size="lg" asChild>
              <Link href="/about">Learn about us</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {["No referral needed", "Cancel anytime", "Insurance accepted"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Clinic CTA ───────────────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-semibold text-slate-900">Are you a clinic?</p>
              <p className="mt-1 text-sm text-slate-500">
                Get your clinic on Lumen in under 5 minutes — website, booking, and patient portal included.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href="/onboard">Get started free →</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
