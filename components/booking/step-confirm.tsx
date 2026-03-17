"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CalendarDays, Clock, MapPin, User, Video, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { BookingState } from "./booking-wizard"
import type { BookingService, BookingProvider } from "@/app/book/page"
import { createAppointment } from "@/lib/actions/booking"

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

interface Props {
  booking: BookingState
  onBack: () => void
  services: BookingService[]
  providers: BookingProvider[]
}

export function StepConfirm({ booking, onBack, services, providers }: Props) {
  const serviceName = services.find((s) => s.id === booking.serviceId)?.name ?? "Appointment"
  const providerName =
    booking.providerId && booking.providerId !== "any"
      ? (providers.find((p) => p.id === booking.providerId)?.name ?? "Provider")
      : "First available provider"
  const [status, setStatus] = useState<"idle" | "loading" | "confirmed">("idle")
  const [confirmCode, setConfirmCode] = useState("")

  const confirm = async () => {
    setStatus("loading")
    const result = await createAppointment({
      serviceId: booking.serviceId!,
      providerId: booking.providerId,
      locationId: booking.locationId,
      date: booking.date!,
      time: booking.time!,
      isVirtual: booking.isVirtual,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      reason: booking.reason,
    })
    if (result.error) {
      toast.error(result.error)
      setStatus("idle")
      return
    }
    setConfirmCode(result.confirmationCode!)
    setStatus("confirmed")
    toast.success("Appointment confirmed!")
  }

  if (status === "confirmed") {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">You&apos;re booked!</h1>
          <p className="mt-2 text-muted-foreground">
            A confirmation has been sent to{" "}
            <strong>{booking.guestEmail}</strong>.
          </p>
        </div>

        <Card className="w-full max-w-sm border border-border/60">
          <CardContent className="p-5 text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Confirmation #{confirmCode}
            </p>
            <div className="space-y-2 text-sm">
              <Row icon={<CalendarDays className="h-4 w-4" />} label={formatDate(booking.date!)} />
              <Row icon={<Clock className="h-4 w-4" />} label={booking.time!} />
              <Row icon={<User className="h-4 w-4" />} label={providerName} />
              <Row icon={booking.isVirtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />} label={booking.isVirtual ? "Telehealth — link sent by email" : "Cedar Hills Clinic"} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          <Button asChild className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90">
            <Link href="/dashboard">View in portal</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Review & confirm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Double-check everything before we lock in your time.
        </p>
      </div>

      <Card className="border border-border/60">
        <CardContent className="p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appointment details
          </p>
          <div className="space-y-3 text-sm">
            <Row icon={<CalendarDays className="h-4 w-4 text-[var(--clinic-primary)]" />} label={formatDate(booking.date!)} />
            <Row icon={<Clock className="h-4 w-4 text-[var(--clinic-primary)]" />} label={booking.time!} />
            <Row icon={<User className="h-4 w-4 text-[var(--clinic-primary)]" />} label={serviceName} />
            <Row icon={<User className="h-4 w-4 text-[var(--clinic-primary)]" />} label={providerName} />
            <Row
              icon={booking.isVirtual ? <Video className="h-4 w-4 text-[var(--clinic-primary)]" /> : <MapPin className="h-4 w-4 text-[var(--clinic-primary)]" />}
              label={booking.isVirtual ? "Telehealth" : "Cedar Hills Clinic"}
            />
          </div>

          <Separator className="my-4" />

          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Patient
          </p>
          <div className="space-y-1.5 text-sm">
            <p className="font-medium text-foreground">{booking.guestName}</p>
            <p className="text-muted-foreground">{booking.guestEmail}</p>
            {booking.guestPhone && <p className="text-muted-foreground">{booking.guestPhone}</p>}
            {booking.reason && (
              <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                {booking.reason}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        By confirming, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/hipaa" className="underline hover:text-foreground">
          HIPAA Notice
        </Link>
        .
      </p>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack} disabled={status === "loading"}>
          Back
        </Button>
        <Button
          onClick={confirm}
          disabled={status === "loading"}
          className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming…
            </>
          ) : (
            "Confirm appointment"
          )}
        </Button>
      </div>
    </div>
  )
}

function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="text-foreground">{label}</span>
    </div>
  )
}
