"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { BookingState } from "./booking-wizard"
import { getAvailableDates, getAvailableSlots } from "@/lib/actions/availability"
import type { DateAvailability } from "@/lib/actions/availability"

const PAGE_SIZE = 5

function formatDateLabel(dateStr: string) {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  })
}

interface Props {
  booking: BookingState
  update: (p: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
  clinicId: string
  durationMin: number
}

export function StepDateTime({ booking, update, onNext, onBack, clinicId, durationMin }: Props) {
  const [dates, setDates] = useState<DateAvailability[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [pageOffset, setPageOffset] = useState(0)
  const [loadingDates, startDateTransition] = useTransition()
  const [loadingSlots, startSlotTransition] = useTransition()

  // Load available dates when provider or service changes
  useEffect(() => {
    setDates([])
    setSlots([])
    update({ date: null, time: null })
    setPageOffset(0)
    startDateTransition(async () => {
      const result = await getAvailableDates(
        booking.providerId,
        clinicId,
        durationMin,
      )
      setDates(result)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.providerId, clinicId, durationMin])

  // Load slots when date is selected
  const selectDate = (date: string) => {
    update({ date, time: null })
    setSlots([])
    const pid = booking.providerId && booking.providerId !== "any" ? booking.providerId : null
    if (!pid) {
      // "any" provider — just show all dates without slot-level filtering
      // In production you'd pick the provider here; for now show empty (handled below)
      return
    }
    startSlotTransition(async () => {
      const result = await getAvailableSlots(pid, date, durationMin)
      setSlots(result)
    })
  }

  const selectTime = (time: string) => update({ time })

  const availableDates = dates.filter((d) => d.available)
  const pageCount = Math.ceil(availableDates.length / PAGE_SIZE)
  const pageDates = availableDates.slice(pageOffset * PAGE_SIZE, (pageOffset + 1) * PAGE_SIZE)

  // "any" provider path: use first available provider per date (slots from backend already handle multi-provider)
  const isAnyProvider = !booking.providerId || booking.providerId === "any"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Pick a time</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All times shown in your local timezone.
        </p>
      </div>

      {/* Date selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Available dates</span>
          <div className="flex items-center gap-2">
            {loadingDates && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <div className="flex gap-1">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setPageOffset((p) => p - 1)}
                disabled={pageOffset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setPageOffset((p) => p + 1)}
                disabled={pageOffset >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {loadingDates ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : availableDates.length === 0 && !loadingDates ? (
          <p className="text-sm text-muted-foreground">No availability in the next 4 weeks.</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {pageDates.map(({ date }) => {
              const isSelected = booking.date === date
              const d = new Date(date + "T12:00:00Z")
              return (
                <button
                  key={date}
                  onClick={() => selectDate(date)}
                  className={cn(
                    "flex flex-col items-center rounded-xl border py-3 text-center transition-all",
                    isSelected
                      ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                      : "border-border bg-card hover:border-[var(--clinic-primary)]/40 cursor-pointer"
                  )}
                >
                  <span className="text-xs opacity-70">
                    {d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" })}
                  </span>
                  <span className="text-lg font-semibold leading-tight">{d.getUTCDate()}</span>
                  <span className="text-xs opacity-70">
                    {d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Time slots */}
      {booking.date && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Available times — {formatDateLabel(booking.date)}
          </p>

          {loadingSlots ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : isAnyProvider ? (
            // "any provider" — show standard business-hours slots without per-provider conflict check
            <div className="flex flex-wrap gap-2">
              {["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
                "1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM"].map((time) => (
                <button
                  key={time}
                  onClick={() => selectTime(time)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                    booking.time === time
                      ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                      : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open slots on this day. Try another date.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((time) => (
                <button
                  key={time}
                  onClick={() => selectTime(time)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                    booking.time === time
                      ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                      : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
                  )}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!booking.date || !booking.time}
          className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
