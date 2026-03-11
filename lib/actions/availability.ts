"use server"

import { createServiceClient } from "@/lib/supabase/server"

type Schedule = {
  provider_id: string
  day_of_week: number
  start_time: string   // "09:00:00"
  end_time: string     // "17:00:00"
  slot_duration_min: number
}

type BookedAppt = { provider_id: string; start_at: string; end_at: string }

/** Time string "09:00:00" → minutes since midnight */
function toMin(t: string) {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

/** Minutes since midnight → "9:00 AM" display string */
function toDisplay(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  const period = h >= 12 ? "PM" : "AM"
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`
}

/** "YYYY-MM-DD" + minutes → UTC ISO string (treats schedule times as UTC — correct on Vercel) */
function toISO(date: string, min: number) {
  return `${date}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00.000Z`
}

function hasConflict(slotStartMin: number, slotEndMin: number, date: string, appts: BookedAppt[]) {
  const slotStart = new Date(toISO(date, slotStartMin)).getTime()
  const slotEnd = new Date(toISO(date, slotEndMin)).getTime()
  return appts.some((a) => {
    const aStart = new Date(a.start_at).getTime()
    const aEnd = new Date(a.end_at).getTime()
    return aStart < slotEnd && aEnd > slotStart
  })
}

/**
 * Returns available time strings ("9:00 AM") for a provider on a specific date.
 * Pass durationMin = the selected service duration.
 */
export async function getAvailableSlots(
  providerId: string,
  date: string,
  durationMin: number
): Promise<string[]> {
  const supabase = await createServiceClient()

  const dow = new Date(date + "T12:00:00Z").getUTCDay()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: schedules }, { data: booked }] = await Promise.all([
    (supabase as any)
      .from("provider_schedules")
      .select("start_time, end_time, slot_duration_min")
      .eq("provider_id", providerId)
      .eq("day_of_week", dow),
    (supabase as any)
      .from("appointments")
      .select("start_at, end_at")
      .eq("provider_id", providerId)
      .neq("status", "cancelled")
      .gte("start_at", `${date}T00:00:00Z`)
      .lt("start_at", `${date}T24:00:00Z`),
  ])

  if (!schedules?.length) return []

  const appts = (booked ?? []) as BookedAppt[]
  const slots: string[] = []

  for (const s of schedules as Pick<Schedule, "start_time" | "end_time" | "slot_duration_min">[]) {
    const schedStart = toMin(s.start_time)
    const schedEnd = toMin(s.end_time)
    let cursor = schedStart
    while (cursor + durationMin <= schedEnd) {
      if (!hasConflict(cursor, cursor + durationMin, date, appts)) {
        slots.push(toDisplay(cursor))
      }
      cursor += s.slot_duration_min
    }
  }

  return slots
}

export type DateAvailability = { date: string; available: boolean }

/**
 * Returns which dates (next `daysAhead` days) have at least one open slot.
 * providerId = null or "any" → checks all active providers for the clinic.
 */
export async function getAvailableDates(
  providerId: string | null,
  clinicId: string,
  durationMin: number,
  daysAhead = 28
): Promise<DateAvailability[]> {
  const supabase = await createServiceClient()

  // Resolve provider IDs
  let providerIds: string[]
  if (providerId && providerId !== "any") {
    providerIds = [providerId]
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: providers } = await (supabase as any)
      .from("providers")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
    providerIds = ((providers ?? []) as { id: string }[]).map((p) => p.id)
  }

  if (providerIds.length === 0) return []

  // Fetch all schedules for these providers in one query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schedules } = await (supabase as any)
    .from("provider_schedules")
    .select("provider_id, day_of_week, start_time, end_time, slot_duration_min")
    .in("provider_id", providerIds)

  if (!schedules?.length) return []

  const scheduleList = schedules as Schedule[]

  // Fetch all booked appointments in the range (one query)
  const rangeStart = new Date()
  rangeStart.setDate(rangeStart.getDate() + 1)
  const rangeEnd = new Date(rangeStart)
  rangeEnd.setDate(rangeStart.getDate() + daysAhead)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appts } = await (supabase as any)
    .from("appointments")
    .select("provider_id, start_at, end_at")
    .in("provider_id", providerIds)
    .neq("status", "cancelled")
    .gte("start_at", rangeStart.toISOString())
    .lte("start_at", rangeEnd.toISOString())

  const apptList = (appts ?? []) as BookedAppt[]

  // Group appointments by "YYYY-MM-DD:provider_id"
  const apptMap = new Map<string, BookedAppt[]>()
  for (const a of apptList) {
    const dateStr = new Date(a.start_at).toISOString().split("T")[0]
    const key = `${dateStr}:${a.provider_id}`
    const existing = apptMap.get(key) ?? []
    existing.push(a)
    apptMap.set(key, existing)
  }

  const result: DateAvailability[] = []

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split("T")[0]
    const dow = d.getUTCDay()

    const daySchedules = scheduleList.filter((s) => s.day_of_week === dow)

    if (daySchedules.length === 0) {
      result.push({ date: dateStr, available: false })
      continue
    }

    let hasSlot = false
    outer: for (const s of daySchedules) {
      const schedStart = toMin(s.start_time)
      const schedEnd = toMin(s.end_time)
      const dayAppts = apptMap.get(`${dateStr}:${s.provider_id}`) ?? []

      let cursor = schedStart
      while (cursor + durationMin <= schedEnd) {
        if (!hasConflict(cursor, cursor + durationMin, dateStr, dayAppts)) {
          hasSlot = true
          break outer
        }
        cursor += s.slot_duration_min
      }
    }

    result.push({ date: dateStr, available: hasSlot })
  }

  return result
}
