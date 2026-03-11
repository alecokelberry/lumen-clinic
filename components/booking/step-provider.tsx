"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import type { BookingState } from "./booking-wizard"
import type { BookingProvider } from "@/app/book/page"

interface Props {
  booking: BookingState
  update: (p: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
  providers: BookingProvider[]
}

export function StepProvider({ booking, update, onNext, onBack, providers }: Props) {
  const select = (id: string) => update({ providerId: id })

  const allProviders = [
    { id: "any", name: "No preference", title: "First available provider" },
    ...providers,
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Choose a provider</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a specific provider or let us find the first available.
        </p>
      </div>

      <div className="space-y-2">
        {allProviders.map((provider) => {
          const isSelected = (booking.providerId ?? "any") === provider.id
          return (
            <button
              key={provider.id}
              onClick={() => select(provider.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-[var(--clinic-primary)] bg-[var(--clinic-accent)]"
                  : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  provider.id === "any"
                    ? "bg-muted text-muted-foreground"
                    : "bg-[var(--clinic-primary)]/10 text-[var(--clinic-primary)]"
                )}
              >
                {provider.id === "any" ? "?" : provider.name.charAt(provider.name.lastIndexOf(" ") + 1)}
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{provider.name}</p>
                <p className="text-xs text-muted-foreground">{provider.title}</p>
              </div>

              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  isSelected
                    ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)]"
                    : "border-border"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
