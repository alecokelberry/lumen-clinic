"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { BookingState } from "./booking-wizard"

interface Props {
  booking: BookingState
  update: (p: Partial<BookingState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepPatientInfo({ booking, update, onNext, onBack }: Props) {
  const isValid = booking.guestName.trim() && booking.guestEmail.trim()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Your information</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No account needed. We&apos;ll send your confirmation to this email.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name *</Label>
            <Input
              id="name"
              placeholder="Jane Smith"
              value={booking.guestName}
              onChange={(e) => update({ guestName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 555-0100"
              value={booking.guestPhone}
              onChange={(e) => update({ guestPhone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address *</Label>
          <Input
            id="email"
            type="email"
            placeholder="jane@example.com"
            value={booking.guestEmail}
            onChange={(e) => update({ guestEmail: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Confirmation and reminders will be sent here.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason for visit</Label>
          <Textarea
            id="reason"
            placeholder="Briefly describe your concern or symptoms..."
            rows={3}
            value={booking.reason}
            onChange={(e) => update({ reason: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Optional — helps your provider prepare for your visit.
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="bg-[var(--clinic-primary)] text-[var(--clinic-primary-foreground)] hover:opacity-90"
        >
          Review appointment
        </Button>
      </div>
    </div>
  )
}
