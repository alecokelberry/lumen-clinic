"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Clock, Video, Check } from "lucide-react"
import type { BookingState } from "./booking-wizard"
import type { BookingService } from "@/app/book/page"

interface Props {
  booking: BookingState
  update: (p: Partial<BookingState>) => void
  onNext: () => void
  services: BookingService[]
}

export function StepService({ booking, update, onNext, services }: Props) {
  const select = (id: string, isVirtual: boolean) => {
    update({ serviceId: id, isVirtual })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">What brings you in?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select the type of appointment you need.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = booking.serviceId === service.id
          return (
            <button
              key={service.id}
              onClick={() => select(service.id, service.is_virtual)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-[var(--clinic-primary)] bg-[var(--clinic-accent)] shadow-sm"
                  : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)]"
                    : "border-border"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{service.name}</span>
                  {service.is_virtual && (
                    <Badge
                      variant="secondary"
                      className="border-[var(--clinic-primary)]/20 bg-[var(--clinic-primary)]/10 text-[var(--clinic-primary)] text-xs"
                    >
                      <Video className="mr-1 h-3 w-3" />
                      Virtual
                    </Badge>
                  )}
                </div>
                {service.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{service.description}</p>
                )}
                <span className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {service.duration_min} min
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={!booking.serviceId}
          className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
