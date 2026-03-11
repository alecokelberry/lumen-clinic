/**
 * Timezone utilities for Lumen Clinic.
 *
 * All provider schedules and display times are in the clinic's local timezone.
 * Appointments are stored as UTC in the database.
 * These helpers convert between the two.
 */

/**
 * Convert a clinic-local date + "HH:MM" time to a UTC Date.
 *
 * Strategy: create a naive UTC Date at the requested time, then measure how
 * far Intl shifts it into the clinic timezone and compensate.
 * Handles DST correctly for first occurrence (fall-back ambiguity is rare
 * in medical scheduling and acceptable to leave as-is).
 */
export function clinicLocalToUTC(dateStr: string, timeHHMM: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  const [hour, minute] = timeHHMM.split(":").map(Number)

  // Start with a naive UTC anchor at the requested time
  const anchor = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))

  // Ask Intl what local h:m this UTC moment corresponds to in the clinic tz
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(anchor)

  const localHour = parseInt(parts.find((p) => p.type === "hour")!.value) % 24
  const localMin  = parseInt(parts.find((p) => p.type === "minute")!.value)

  // Offset = local - UTC anchor (in minutes); subtract to go local→UTC
  const diffMin = (localHour * 60 + localMin) - (hour * 60 + minute)
  return new Date(anchor.getTime() - diffMin * 60_000)
}

/**
 * Return the day of week (0=Sun … 6=Sat) for a date string in a given timezone.
 * Using noon UTC avoids date-boundary issues.
 */
export function getDayOfWeekInTz(dateStr: string, timezone: string): number {
  const [year, month, day] = dateStr.split("-").map(Number)
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  const name = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "long" }).format(noon)
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].indexOf(name)
}

/**
 * Format a UTC ISO string as a time in the clinic timezone ("9:00 AM").
 */
export function formatTimeInTz(utcIso: string, timezone: string): string {
  return new Date(utcIso).toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Format a UTC ISO string as a full date in the clinic timezone
 * ("Monday, March 11, 2026").
 */
export function formatDateInTz(utcIso: string, timezone: string): string {
  return new Date(utcIso).toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Return today's date string ("YYYY-MM-DD") in the clinic timezone.
 */
export function todayInTz(timezone: string): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: timezone }) // en-CA gives YYYY-MM-DD
}

/** Common timezone options for the settings picker. */
export const TIMEZONE_OPTIONS = [
  { value: "America/New_York",    label: "Eastern (ET)" },
  { value: "America/Chicago",     label: "Central (CT)" },
  { value: "America/Denver",      label: "Mountain (MT)" },
  { value: "America/Phoenix",     label: "Arizona (no DST)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage",   label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu",    label: "Hawaii (HT)" },
  { value: "America/Puerto_Rico", label: "Atlantic (AT)" },
  { value: "Europe/London",       label: "London (GMT/BST)" },
  { value: "Europe/Paris",        label: "Paris (CET)" },
  { value: "Asia/Dubai",          label: "Dubai (GST)" },
  { value: "Asia/Singapore",      label: "Singapore (SGT)" },
  { value: "Australia/Sydney",    label: "Sydney (AEDT)" },
  { value: "UTC",                 label: "UTC" },
]
