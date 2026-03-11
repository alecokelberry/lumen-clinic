"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { clinicLocalToUTC, getDayOfWeekInTz, todayInTz } from "@/lib/tz"

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

/** Minutes since midnight → "HH:MM" for timezone conversion */
function toHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
}

function hasConflict(
  slotStartUTC: number,
  slotEndUTC: number,
  appts: BookedAppt[]
) {
  return appts.some((a) => {
    const aStart = new Date(a.start_at).getTime()
    const aEnd   = new Date(a.end_at).getTime()
    return aStart < slotEndUTC && aEnd > slotStartUTC
  })
}

/**
 * Returns available time strings ("9:00 AM") for a provider on a specific date.
 * Times are in the clinic's local timezone.
 */
export async function getAvailableSlots(
  providerId: string,
  date: string,
  durationMin: number
): Promise<string[]> {
  const supabase = await createServiceClient()

  // Fetch clinic timezone via provider → clinic join
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: provRow } = await supabase
    .from("providers")
    .select("clinic_id, clinics(timezone)")
    .eq("id", providerId)
    .single()

  const timezone: string =
    (provRow as { clinics: { timezone: string } } | null)?.clinics?.timezone ?? "UTC"

  const dow = getDayOfWeekInTz(date, timezone)

  // Fetch schedule + booked appointments in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: schedules }, { data: booked }] = await Promise.all([
    supabase
      .from("provider_schedules")
      .select("start_time, end_time, slot_duration_min")
      .eq("provider_id", providerId)
      .eq("day_of_week", dow),
    // Fetch appointments for the full clinic-local day (add buffer for timezone offset)
    supabase
      .from("appointments")
      .select("start_at, end_at")
      .eq("provider_id", providerId)
      .neq("status", "cancelled")
      .gte("start_at", clinicLocalToUTC(date, "00:00", timezone).toISOString())
      .lt("start_at",  clinicLocalToUTC(date, "23:59", timezone).toISOString()),
  ])

  if (!schedules?.length) return []

  const appts = (booked ?? []) as BookedAppt[]
  const slots: string[] = []

  for (const s of schedules as Pick<Schedule, "start_time" | "end_time" | "slot_duration_min">[]) {
    const schedStart = toMin(s.start_time)
    const schedEnd   = toMin(s.end_time)
    let cursor = schedStart

    while (cursor + durationMin <= schedEnd) {
      const slotStartUTC = clinicLocalToUTC(date, toHHMM(cursor), timezone).getTime()
      const slotEndUTC   = clinicLocalToUTC(date, toHHMM(cursor + durationMin), timezone).getTime()

      if (!hasConflict(slotStartUTC, slotEndUTC, appts)) {
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

  // Fetch clinic timezone
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: clinicRow } = await supabase
    .from("clinics").select("timezone").eq("id", clinicId).single()
  const timezone: string = (clinicRow as { timezone: string } | null)?.timezone ?? "UTC"

  // Resolve provider IDs
  let providerIds: string[]
  if (providerId && providerId !== "any") {
    providerIds = [providerId]
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: providers } = await supabase
      .from("providers")
      .select("id")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
    providerIds = ((providers ?? []) as { id: string }[]).map((p) => p.id)
  }

  if (providerIds.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schedules } = await supabase
    .from("provider_schedules")
    .select("provider_id, day_of_week, start_time, end_time, slot_duration_min")
    .in("provider_id", providerIds)

  if (!schedules?.length) return []

  const scheduleList = schedules as Schedule[]

  // Build date range in clinic timezone
  const todayStr = todayInTz(timezone)
  const [ty, tm, td] = todayStr.split("-").map(Number)
  const rangeStartUTC = clinicLocalToUTC(todayStr, "00:00", timezone)
  const rangeEndDate = new Date(Date.UTC(ty, tm - 1, td + daysAhead + 1))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appts } = await supabase
    .from("appointments")
    .select("provider_id, start_at, end_at")
    .in("provider_id", providerIds)
    .neq("status", "cancelled")
    .gte("start_at", rangeStartUTC.toISOString())
    .lte("start_at", rangeEndDate.toISOString())

  const apptList = (appts ?? []) as BookedAppt[]

  // Group appointments by "YYYY-MM-DD:provider_id" (date in clinic timezone)
  const apptMap = new Map<string, BookedAppt[]>()
  for (const a of apptList) {
    const dateStr = new Date(a.start_at).toLocaleDateString("en-CA", { timeZone: timezone })
    const key = `${dateStr}:${a.provider_id}`
    const existing = apptMap.get(key) ?? []
    existing.push(a)
    apptMap.set(key, existing)
  }

  const result: DateAvailability[] = []

  for (let i = 1; i <= daysAhead; i++) {
    // Get date string i days from today in clinic timezone
    const d = new Date(Date.UTC(ty, tm - 1, td + i, 12, 0, 0))
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: timezone })
    const dow = getDayOfWeekInTz(dateStr, timezone)

    const daySchedules = scheduleList.filter((s) => s.day_of_week === dow)
    if (daySchedules.length === 0) {
      result.push({ date: dateStr, available: false })
      continue
    }

    let hasSlot = false
    outer: for (const s of daySchedules) {
      const schedStart = toMin(s.start_time)
      const schedEnd   = toMin(s.end_time)
      const dayAppts   = apptMap.get(`${dateStr}:${s.provider_id}`) ?? []

      let cursor = schedStart
      while (cursor + durationMin <= schedEnd) {
        const slotStartUTC = clinicLocalToUTC(dateStr, toHHMM(cursor), timezone).getTime()
        const slotEndUTC   = clinicLocalToUTC(dateStr, toHHMM(cursor + durationMin), timezone).getTime()

        if (!hasConflict(slotStartUTC, slotEndUTC, dayAppts)) {
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
