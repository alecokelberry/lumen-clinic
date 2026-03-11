"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface DayScheduleInput {
  day_of_week: number        // 0 = Sun … 6 = Sat
  enabled: boolean
  start_time: string         // "09:00"
  end_time: string           // "17:00"
  slot_duration_min: number
}

export async function saveProviderSchedule(
  providerId: string,
  locationId: string,
  days: DayScheduleInput[]
): Promise<{ error?: string }> {
  const supabase = await createServiceClient()

  const enabled = days.filter((d) => d.enabled)
  const disabledDows = days.filter((d) => !d.enabled).map((d) => d.day_of_week)

  // Delete disabled days
  if (disabledDows.length > 0) {
    const { error } = await supabase
      .from("provider_schedules")
      .delete()
      .eq("provider_id", providerId)
      .in("day_of_week", disabledDows)
    if (error) return { error: error.message }
  }

  // Upsert enabled days
  if (enabled.length > 0) {
    const rows = enabled.map((d) => ({
      provider_id: providerId,
      location_id: locationId,
      day_of_week: d.day_of_week,
      start_time: d.start_time + ":00",   // "09:00" → "09:00:00"
      end_time: d.end_time + ":00",
      slot_duration_min: d.slot_duration_min,
    }))

    const { error } = await supabase
      .from("provider_schedules")
      .upsert(rows, { onConflict: "provider_id,day_of_week" })
    if (error) return { error: error.message }
  }

  revalidatePath("/admin/providers")
  revalidatePath("/book")
  return {}
}
