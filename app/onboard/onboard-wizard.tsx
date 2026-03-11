"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  Plus, Trash2, Building2, Palette, MapPin, Stethoscope, Rocket,
} from "lucide-react"
import { createClinic, checkSlugAvailable, type OnboardInput } from "@/lib/actions/onboard"
import { TIMEZONE_OPTIONS } from "@/lib/tz"

// ─── Types ────────────────────────────────────────────────────────────────────
type Service = { name: string; duration_min: number; is_virtual: boolean; price_cents: number | null }
type DayHours = { day: string; open: string; close: string; closed: boolean }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const DURATIONS = [15, 20, 30, 45, 60, 90]
const SLOT_OPTIONS = [30, 45, 60]

const DEFAULT_HOURS: DayHours[] = DAYS.map((day) => ({
  day,
  open: "09:00",
  close: "17:00",
  closed: day === "Saturday" || day === "Sunday",
}))

const DEFAULT_SERVICES: Service[] = [
  { name: "New Patient Visit", duration_min: 60, is_virtual: false, price_cents: null },
  { name: "Follow-Up", duration_min: 30, is_virtual: false, price_cents: null },
]

const STEPS = [
  { label: "Clinic", icon: Building2 },
  { label: "Brand", icon: Palette },
  { label: "Location", icon: MapPin },
  { label: "Services", icon: Stethoscope },
  { label: "Done", icon: Rocket },
]

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// ─── Wizard ───────────────────────────────────────────────────────────────────
export function OnboardWizard({ rootDomain }: { rootDomain: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [doneSlug, setDoneSlug] = useState("")

  // Form state
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [tagline, setTagline] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [primary, setPrimary] = useState("#2563eb")
  const [accent, setAccent] = useState("#eff6ff")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [timezone, setTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return "America/New_York" }
  })
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS)
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES)

  // Auto-slug from name
  useEffect(() => {
    if (name) setSlug(slugify(name))
  }, [name])

  // Debounced slug availability check
  useEffect(() => {
    if (!slug) { setSlugAvailable(null); return }
    setCheckingSlug(true)
    const t = setTimeout(async () => {
      const available = await checkSlugAvailable(slug)
      setSlugAvailable(available)
      setCheckingSlug(false)
    }, 500)
    return () => clearTimeout(t)
  }, [slug])

  const updateHour = (idx: number, patch: Partial<DayHours>) =>
    setHours((prev) => prev.map((h, i) => (i === idx ? { ...h, ...patch } : h)))

  const addService = () =>
    setServices((prev) => [...prev, { name: "", duration_min: 30, is_virtual: false, price_cents: null }])

  const updateService = (idx: number, patch: Partial<Service>) =>
    setServices((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)))

  const removeService = (idx: number) =>
    setServices((prev) => prev.filter((_, i) => i !== idx))

  const canNext = () => {
    if (step === 0) return name.trim() && slug && slugAvailable === true && email.trim()
    if (step === 2) return address.trim() && city.trim() && state.trim()
    if (step === 3) return services.every((s) => s.name.trim())
    return true
  }

  const handleSubmit = () => {
    const input: OnboardInput = {
      name, slug, tagline, email, phone,
      primary_color: primary, accent_color: accent,
      address, city, state, zip, timezone, hours, services,
    }
    startTransition(async () => {
      const result = await createClinic(input)
      if (result.error) {
        toast.error(result.error)
      } else {
        setDoneSlug(result.slug!)
        setStep(4)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Progress */}
      {step < 4 && (
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.slice(0, 4).map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all",
                  i < step ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                    : i === step ? "border-[var(--clinic-primary)] text-[var(--clinic-primary)]"
                    : "border-border text-muted-foreground"
                )}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                {i < 3 && (
                  <div className={cn("mx-2 h-0.5 flex-1 transition-all",
                    i < step ? "bg-[var(--clinic-primary)]" : "bg-border"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between px-0.5">
            {STEPS.slice(0, 4).map((s) => (
              <span key={s.label} className="text-xs text-muted-foreground">{s.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 0: Clinic identity ── */}
      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Tell us about your clinic</h1>
            <p className="mt-1 text-sm text-muted-foreground">This takes about 5 minutes.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Clinic name *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Riverside Family Medicine" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Your URL *</Label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">{rootDomain}/</span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="riverside"
                  className="font-mono"
                />
              </div>
              {slug && (
                <p className={cn("text-xs", slugAvailable === true ? "text-green-600" : slugAvailable === false ? "text-destructive" : "text-muted-foreground")}>
                  {checkingSlug ? "Checking…" : slugAvailable === true ? `✓ ${slug}.${rootDomain} is available` : slugAvailable === false ? `✗ "${slug}" is already taken` : ""}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Compassionate care for every patient." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Contact email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@yourclinic.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone <span className="text-muted-foreground">(optional)</span></Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Branding ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Your brand colors</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pick colors that match your clinic's identity.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Primary color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input p-0.5" />
                <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="font-mono uppercase" maxLength={7} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Accent color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input p-0.5" />
                <Input value={accent} onChange={(e) => setAccent(e.target.value)} className="font-mono uppercase" maxLength={7} />
              </div>
            </div>
          </div>
          {/* Preview */}
          <Card className="border border-border/60">
            <CardContent className="p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</p>
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: accent }}>
                <p className="font-bold" style={{ color: primary }}>{name || "Your Clinic"}</p>
                <p className="text-sm text-foreground">{tagline || "Your tagline here."}</p>
                <button className="rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: primary }}>
                  Book appointment
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Your location</h1>
            <p className="mt-1 text-sm text-muted-foreground">Where patients will come to see you.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="addr">Street address *</Label>
              <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="city">City *</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Springfield" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State *</Label>
                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="IL" maxLength={2} className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP</Label>
                <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="62701" maxLength={10} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone *</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                All appointment times will display in this timezone.
              </p>
            </div>

            {/* Hours */}
            <div className="space-y-3">
              <Label>Office hours</Label>
              {hours.map((h, i) => (
                <div key={h.day} className="flex items-center gap-3">
                  <button
                    onClick={() => updateHour(i, { closed: !h.closed })}
                    className={cn(
                      "w-24 shrink-0 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-all",
                      !h.closed ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white" : "border-border text-muted-foreground"
                    )}
                  >
                    {h.day.slice(0, 3)}
                  </button>
                  {h.closed ? (
                    <span className="text-xs text-muted-foreground">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input type="time" value={h.open} onChange={(e) => updateHour(i, { open: e.target.value })} className="w-28 text-sm" />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input type="time" value={h.close} onChange={(e) => updateHour(i, { close: e.target.value })} className="w-28 text-sm" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Services ── */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Your services</h1>
            <p className="mt-1 text-sm text-muted-foreground">What can patients book? You can edit these later.</p>
          </div>
          <div className="space-y-3">
            {services.map((svc, i) => (
              <Card key={i} className="border border-border/60">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={svc.name}
                      onChange={(e) => updateService(i, { name: e.target.value })}
                      placeholder="Service name"
                      className="flex-1"
                    />
                    <button onClick={() => removeService(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <div className="flex gap-1">
                        {DURATIONS.map((d) => (
                          <button key={d} onClick={() => updateService(i, { duration_min: d })}
                            className={cn("rounded-md border px-2 py-1 text-xs font-medium transition-all",
                              svc.duration_min === d
                                ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                                : "border-border hover:border-[var(--clinic-primary)]/40"
                            )}>
                            {d}m
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <div className="flex gap-1">
                        {[false, true].map((v) => (
                          <button key={String(v)} onClick={() => updateService(i, { is_virtual: v })}
                            className={cn("rounded-md border px-2 py-1 text-xs font-medium transition-all",
                              svc.is_virtual === v
                                ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                                : "border-border hover:border-[var(--clinic-primary)]/40"
                            )}>
                            {v ? "Telehealth" : "In-person"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Price (optional)</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          value={svc.price_cents !== null ? svc.price_cents / 100 : ""}
                          onChange={(e) => updateService(i, {
                            price_cents: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null
                          })}
                          placeholder="—"
                          className="w-20 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {services.length < 8 && (
              <button onClick={addService}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 py-3 text-sm text-muted-foreground transition-colors hover:border-[var(--clinic-primary)]/40 hover:text-foreground">
                <Plus className="h-4 w-4" /> Add service
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Done ── */}
      {step === 4 && (
        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">You're live!</h1>
            <p className="mt-2 text-muted-foreground">
              {name} is now on Lumen Clinic.
            </p>
          </div>
          <Card className="border border-border/60 text-left">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your clinic URL</p>
                <p className="mt-1 font-mono text-sm font-medium text-foreground">
                  https://{doneSlug}.{rootDomain}
                </p>
              </div>
              <div className="space-y-2 border-t border-border/60 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Next steps</p>
                {[
                  "Add providers in your admin dashboard",
                  "Set provider availability schedules",
                  "Go to Clerk → Users → set your role to \"admin\"",
                  "Share your booking link with patients",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--clinic-primary)] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button
            asChild
            className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
            size="lg"
          >
            <a href={`https://${doneSlug}.${rootDomain}/admin`}>
              Go to your admin dashboard →
            </a>
          </Button>
        </div>
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || isPending}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canNext() || isPending}
              className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
            >
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating clinic…</> : <>Launch clinic <Rocket className="ml-2 h-4 w-4" /></>}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
