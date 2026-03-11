"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getAvailableDates, getAvailableSlots } from "@/lib/actions/availability"
import { rescheduleAppointment } from "@/lib/actions/appointments"
import type { DateAvailability } from "@/lib/actions/availability"

const PAGE_SIZE = 5

interface Props {
  appointmentId: string
  providerId: string
  clinicId: string
  durationMin: number
}

export function RescheduleWidget({ appointmentId, providerId, clinicId, durationMin }: Props) {
  const router = useRouter()
  const [dates, setDates] = useState<DateAvailability[]>([])
  const [slots, setSlots] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [pageOffset, setPageOffset] = useState(0)
  const [loadingDates, startDateTransition] = useTransition()
  const [loadingSlots, startSlotTransition] = useTransition()
  const [saving, startSaveTransition] = useTransition()

  useEffect(() => {
    startDateTransition(async () => {
      const result = await getAvailableDates(providerId, clinicId, durationMin)
      setDates(result)
    })
  }, [providerId, clinicId, durationMin])

  const selectDate = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(null)
    setSlots([])
    startSlotTransition(async () => {
      const result = await getAvailableSlots(providerId, date, durationMin)
      setSlots(result)
    })
  }

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) return
    startSaveTransition(async () => {
      const result = await rescheduleAppointment(appointmentId, selectedDate, selectedTime)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Appointment rescheduled!")
        router.push("/appointments")
      }
    })
  }

  const available = dates.filter((d) => d.available)
  const pageCount = Math.ceil(available.length / PAGE_SIZE)
  const pageDates = available.slice(pageOffset * PAGE_SIZE, (pageOffset + 1) * PAGE_SIZE)

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Choose a date</span>
          <div className="flex items-center gap-2">
            {loadingDates && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setPageOffset((p) => p - 1)} disabled={pageOffset === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => setPageOffset((p) => p + 1)} disabled={pageOffset >= pageCount - 1}>
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
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground">No availability in the next 4 weeks.</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {pageDates.map(({ date }) => {
              const isSelected = selectedDate === date
              const d = new Date(date + "T12:00:00Z")
              return (
                <button key={date} onClick={() => selectDate(date)}
                  className={cn(
                    "flex flex-col items-center rounded-xl border py-3 text-center transition-all",
                    isSelected
                      ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                      : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
                  )}>
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
      {selectedDate && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Choose a time — {new Date(selectedDate + "T12:00:00Z").toLocaleDateString("en-US", {
              weekday: "long", month: "long", day: "numeric", timeZone: "UTC"
            })}
          </p>
          {loadingSlots ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open slots on this day. Try another date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((time) => (
                <button key={time} onClick={() => setSelectedTime(time)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                    selectedTime === time
                      ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                      : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
                  )}>
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!selectedDate || !selectedTime || saving}
          className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
        >
          {saving ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm new time</>
          )}
        </Button>
      </div>
    </div>
  )
}
