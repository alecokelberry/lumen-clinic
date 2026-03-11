"use client"

import { use, useState } from "react"
import { StepService } from "@/components/booking/step-service"
import { StepProvider } from "@/components/booking/step-provider"
import { StepDateTime } from "@/components/booking/step-datetime"
import { StepPatientInfo } from "@/components/booking/step-patient-info"
import { StepConfirm } from "@/components/booking/step-confirm"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { BookingService, BookingProvider } from "@/app/book/page"

export interface BookingState {
  serviceId: string | null
  providerId: string | null
  locationId: string | null
  date: string | null
  time: string | null
  isVirtual: boolean
  guestName: string
  guestEmail: string
  guestPhone: string
  reason: string
}

const STEPS = [
  { id: 1, label: "Service" },
  { id: 2, label: "Provider" },
  { id: 3, label: "Date & Time" },
  { id: 4, label: "Your Info" },
  { id: 5, label: "Confirm" },
]

interface BookingWizardProps {
  searchParams: Promise<{
    service?: string
    provider?: string
    date?: string
    step?: string
  }>
  services: BookingService[]
  providers: BookingProvider[]
  clinicId: string
}

export function BookingWizard({ searchParams, services, providers, clinicId }: BookingWizardProps) {
  const params = use(searchParams)

  const [step, setStep] = useState(() => {
    const s = parseInt(params.step ?? "1", 10)
    return isNaN(s) ? 1 : s
  })

  const [booking, setBooking] = useState<BookingState>({
    serviceId: params.service ?? null,
    providerId: params.provider ?? null,
    locationId: null,
    date: params.date ?? null,
    time: null,
    isVirtual: false,
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    reason: "",
  })

  const update = (partial: Partial<BookingState>) =>
    setBooking((prev) => ({ ...prev, ...partial }))

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length))
  const back = () => setStep((s) => Math.max(s - 1, 1))

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex flex-1 items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  step > s.id
                    ? "bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)]"
                    : step === s.id
                    ? "border-2 border-[var(--clinic-primary)] bg-background text-[var(--clinic-primary)]"
                    : "border-2 border-border bg-background text-muted-foreground"
                )}
              >
                {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
              </div>
              <span
                className={cn(
                  "mt-1 hidden text-xs md:block",
                  step === s.id ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 transition-colors",
                  step > s.id ? "bg-[var(--clinic-primary)]" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <StepService booking={booking} update={update} onNext={next} services={services} />
        )}
        {step === 2 && (
          <StepProvider booking={booking} update={update} onNext={next} onBack={back} providers={providers} />
        )}
        {step === 3 && (
          <StepDateTime
            booking={booking}
            update={update}
            onNext={next}
            onBack={back}
            clinicId={clinicId}
            durationMin={services.find((s) => s.id === booking.serviceId)?.duration_min ?? 30}
          />
        )}
        {step === 4 && (
          <StepPatientInfo booking={booking} update={update} onNext={next} onBack={back} />
        )}
        {step === 5 && (
          <StepConfirm booking={booking} onBack={back} services={services} providers={providers} />
        )}
      </div>
    </div>
  )
}
