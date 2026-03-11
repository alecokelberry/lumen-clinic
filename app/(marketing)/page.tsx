import { getClinic } from "@/lib/clinic"
import { BookButton } from "@/components/shared/book-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CalendarDays,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Video,
} from "lucide-react"
import Link from "next/link"

// Demo data — replaced by Supabase queries once DB is live
const DEMO_SERVICES = [
  { id: "1", name: "New Patient Visit", description: "Comprehensive first-time evaluation with one of our specialists.", duration_min: 60, is_virtual: false },
  { id: "2", name: "Follow-Up", description: "Routine follow-up for existing patients.", duration_min: 30, is_virtual: false },
  { id: "3", name: "Telehealth Consultation", description: "Meet with your provider from the comfort of home.", duration_min: 30, is_virtual: true },
  { id: "4", name: "Allergy Testing", description: "Full panel allergy testing and results review.", duration_min: 90, is_virtual: false },
  { id: "5", name: "Hearing Evaluation", description: "Comprehensive hearing assessment by an audiologist.", duration_min: 45, is_virtual: false },
  { id: "6", name: "Prescription Refill", description: "Quick check-in for medication renewals.", duration_min: 15, is_virtual: true },
]

const DEMO_PROVIDERS = [
  { id: "1", name: "Dr. Sarah Chen", title: "Otolaryngologist, MD", bio: "Board-certified ENT specialist with 15 years of experience in sinus, allergy, and head & neck surgery.", photo_url: null },
  { id: "2", name: "Dr. Marcus Webb", title: "Otolaryngologist, MD", bio: "Specializing in pediatric ENT and minimally invasive ear surgery.", photo_url: null },
  { id: "3", name: "Dr. Priya Nair", title: "Audiologist, AuD", bio: "Expert in hearing loss, tinnitus management, and hearing aids.", photo_url: null },
]

const DEMO_TESTIMONIALS = [
  { id: "1", name: "Jennifer K.", text: "Booking online was effortless and I was seen within 48 hours. The team is incredibly kind.", rating: 5 },
  { id: "2", name: "Tom R.", text: "Finally a doctor's office that doesn't require faxing my insurance card. Everything was handled digitally.", rating: 5 },
  { id: "3", name: "Maria S.", text: "The telehealth option was a lifesaver. Same great care, no commute.", rating: 5 },
]

export default async function HomePage() {
  const clinic = await getClinic()

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--clinic-accent)] via-background to-background">
        <div className="mx-auto max-w-6xl px-4 py-24 md:px-6 md:py-36">
          <div className="max-w-2xl">
            <Badge
              variant="secondary"
              className="mb-5 border-[var(--clinic-primary)]/20 bg-[var(--clinic-accent)] text-[var(--clinic-primary)]"
            >
              Now accepting new patients
            </Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
              {clinic.tagline ?? `Expert care from ${clinic.name}`}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Book in minutes. No phone calls, no paperwork, no waiting room
              surprises. Just clear, compassionate care — on your schedule.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <BookButton size="lg" />
              <Button variant="outline" size="lg" asChild>
                <Link href="/providers">Meet Our Providers</Link>
              </Button>
            </div>
            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-[var(--clinic-primary)]" />
                Same-week appointments
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-[var(--clinic-primary)]" />
                Telehealth available
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[var(--clinic-primary)]" />
                HIPAA secure
              </span>
            </div>
          </div>
        </div>
        {/* Decorative background shape */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-5"
          style={{
            background: `radial-gradient(ellipse at right top, var(--clinic-primary) 0%, transparent 70%)`,
          }}
        />
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              What we treat
            </h2>
            <p className="mt-2 text-muted-foreground">
              Comprehensive care across all specialties.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/services">View all →</Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_SERVICES.map((service) => (
            <Card
              key={service.id}
              className="group cursor-pointer border border-border/60 transition-all hover:border-[var(--clinic-primary)]/40 hover:shadow-sm"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.is_virtual && (
                        <Badge variant="secondary" className="text-xs">
                          <Video className="mr-1 h-3 w-3" />
                          Virtual
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {service.duration_min} min
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="h-7 px-3 text-xs text-[var(--clinic-primary)] hover:bg-[var(--clinic-accent)]"
                  >
                    <Link href={`/book?service=${service.id}`}>Book →</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Providers ────────────────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Your care team
              </h2>
              <p className="mt-2 text-muted-foreground">
                Board-certified specialists who take time to listen.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/providers">All providers →</Link>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {DEMO_PROVIDERS.map((provider) => (
              <Card
                key={provider.id}
                className="overflow-hidden border border-border/60"
              >
                {/* Provider photo */}
                <div className="aspect-[4/3] bg-gradient-to-br from-[var(--clinic-accent)] to-muted flex items-center justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--clinic-primary)]/10 text-3xl font-bold text-[var(--clinic-primary)]">
                    {provider.name.charAt(3)}
                  </div>
                </div>
                <CardContent className="p-5">
                  <p className="font-semibold text-foreground">{provider.name}</p>
                  <p className="text-sm text-muted-foreground">{provider.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {provider.bio}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-4 w-full bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
                  >
                    <Link href={`/book?provider=${provider.id}`}>
                      <CalendarDays className="mr-2 h-3.5 w-3.5" />
                      Book with {provider.name.split(" ")[1]}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Lumen ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
        <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          A better way to get care
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Book in 60 seconds",
              body: "Real-time availability, no phone calls, instant confirmation with everything you need.",
            },
            {
              icon: MessageSquare,
              title: "Secure messaging",
              body: "Message your care team directly, get results, and ask follow-up questions — no phone tag.",
            },
            {
              icon: MapPin,
              title: "Multiple locations",
              body: "Choose the location and provider that's most convenient. All records follow you.",
            },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--clinic-accent)]">
                <item.icon className="h-5 w-5 text-[var(--clinic-primary)]" />
              </div>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            What patients say
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {DEMO_TESTIMONIALS.map((t) => (
              <Card key={t.id} className="border border-border/60">
                <CardContent className="p-5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">
                    — {t.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center md:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Ready to feel better?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Book your appointment online in under a minute. No referral needed.
        </p>
        <BookButton size="lg" className="mt-7" />
      </section>

      {/* ── Clinic CTA ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-semibold text-foreground">Are you a clinic?</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
