"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveProviderSchedule, type DayScheduleInput } from "@/lib/actions/schedules"

const DAYS = [
  { label: "Sun", short: "S", dow: 0 },
  { label: "Mon", short: "M", dow: 1 },
  { label: "Tue", short: "T", dow: 2 },
  { label: "Wed", short: "W", dow: 3 },
  { label: "Thu", short: "T", dow: 4 },
  { label: "Fri", short: "F", dow: 5 },
  { label: "Sat", short: "S", dow: 6 },
]

const SLOT_OPTIONS = [15, 20, 30, 45, 60]

interface ExistingSchedule {
  day_of_week: number
  start_time: string   // "09:00:00"
  end_time: string
  slot_duration_min: number
}

interface Props {
  providerId: string
  locationId: string
  existing: ExistingSchedule[]
}

function stripSeconds(t: string) {
  // "09:00:00" → "09:00"
  return t.slice(0, 5)
}

export function ScheduleEditor({ providerId, locationId, existing }: Props) {
  const [days, setDays] = useState<DayScheduleInput[]>(() =>
    DAYS.map(({ dow }) => {
      const found = existing.find((e) => e.day_of_week === dow)
      return {
        day_of_week: dow,
        enabled: !!found,
        start_time: found ? stripSeconds(found.start_time) : "09:00",
        end_time: found ? stripSeconds(found.end_time) : "17:00",
        slot_duration_min: found?.slot_duration_min ?? 30,
      }
    })
  )

  const [isPending, startTransition] = useTransition()

  const update = (dow: number, patch: Partial<DayScheduleInput>) =>
    setDays((prev) => prev.map((d) => (d.day_of_week === dow ? { ...d, ...patch } : d)))

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveProviderSchedule(providerId, locationId, days)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Schedule saved.")
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Day toggles */}
      <div className="flex gap-2">
        {DAYS.map(({ label, dow }) => {
          const d = days.find((x) => x.day_of_week === dow)!
          return (
            <button
              key={dow}
              onClick={() => update(dow, { enabled: !d.enabled })}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                d.enabled
                  ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                  : "border-border bg-card text-muted-foreground hover:border-[var(--clinic-primary)]/40"
              )}
            >
              {label.slice(0, 2)}
            </button>
          )
        })}
      </div>

      {/* Per-day settings */}
      <div className="space-y-3">
        {DAYS.map(({ label, dow }) => {
          const d = days.find((x) => x.day_of_week === dow)!
          if (!d.enabled) return null
          return (
            <Card key={dow} className="border border-border/60">
              <CardContent className="flex flex-wrap items-end gap-4 p-4">
                <div className="w-10 shrink-0">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Start</Label>
                  <Input
                    type="time"
                    value={d.start_time}
                    onChange={(e) => update(dow, { start_time: e.target.value })}
                    className="w-32 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">End</Label>
                  <Input
                    type="time"
                    value={d.end_time}
                    onChange={(e) => update(dow, { end_time: e.target.value })}
                    className="w-32 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Slot</Label>
                  <div className="flex gap-1">
                    {SLOT_OPTIONS.map((min) => (
                      <button
                        key={min}
                        onClick={() => update(dow, { slot_duration_min: min })}
                        className={cn(
                          "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
                          d.slot_duration_min === min
                            ? "border-[var(--clinic-primary)] bg-[var(--clinic-primary)] text-white"
                            : "border-border bg-card hover:border-[var(--clinic-primary)]/40"
                        )}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ml-auto text-xs text-muted-foreground">
                  {/* Slot count preview */}
                  {(() => {
                    const [sh, sm] = d.start_time.split(":").map(Number)
                    const [eh, em] = d.end_time.split(":").map(Number)
                    const totalMin = (eh * 60 + em) - (sh * 60 + sm)
                    const count = totalMin > 0 ? Math.floor(totalMin / d.slot_duration_min) : 0
                    return count > 0 ? `${count} slots` : "—"
                  })()}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {!days.some((d) => d.enabled) && (
          <p className="rounded-xl border border-dashed border-border/60 py-8 text-center text-sm text-muted-foreground">
            No days selected. Toggle days above to set availability.
          </p>
        )}
      </div>

      <div className="flex justify-end border-t border-border/60 pt-4">
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save schedule</>
          )}
        </Button>
      </div>
    </div>
  )
}
