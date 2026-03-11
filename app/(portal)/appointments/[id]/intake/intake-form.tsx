"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"
import { saveIntakeForm, type IntakeAnswers } from "@/lib/actions/intake"

interface Props {
  appointmentId: string
  prefillReason: string
  existing: IntakeAnswers | null
}

export function IntakeForm({ appointmentId, prefillReason, existing }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<IntakeAnswers>({
    reason: existing?.reason ?? prefillReason,
    medications: existing?.medications ?? "",
    allergies: existing?.allergies ?? "",
    medical_history: existing?.medical_history ?? "",
    emergency_contact_name: existing?.emergency_contact_name ?? "",
    emergency_contact_phone: existing?.emergency_contact_phone ?? "",
    insurance_carrier: existing?.insurance_carrier ?? "",
    insurance_member_id: existing?.insurance_member_id ?? "",
  })

  const set = (key: keyof IntakeAnswers) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await saveIntakeForm(appointmentId, form)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Intake form submitted.")
        router.push("/appointments")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Visit info */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Visit information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for visit</Label>
            <Textarea
              id="reason"
              value={form.reason}
              onChange={set("reason")}
              rows={2}
              placeholder="Describe what brings you in today…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medical history */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Medical history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="medications">Current medications</Label>
            <Textarea
              id="medications"
              value={form.medications}
              onChange={set("medications")}
              rows={3}
              placeholder="List any medications you're currently taking, including dosage…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={form.allergies}
              onChange={set("allergies")}
              rows={2}
              placeholder="Drug allergies, food allergies, environmental allergies…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history">Relevant medical history</Label>
            <Textarea
              id="history"
              value={form.medical_history}
              onChange={set("medical_history")}
              rows={3}
              placeholder="Past surgeries, chronic conditions, family history…"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency contact */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Emergency contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name">Name</Label>
            <Input
              id="ec-name"
              value={form.emergency_contact_name}
              onChange={set("emergency_contact_name")}
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ec-phone">Phone</Label>
            <Input
              id="ec-phone"
              type="tel"
              value={form.emergency_contact_phone}
              onChange={set("emergency_contact_phone")}
              placeholder="(555) 000-0000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Insurance */}
      <Card className="border border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Insurance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="carrier">Insurance carrier</Label>
            <Input
              id="carrier"
              value={form.insurance_carrier}
              onChange={set("insurance_carrier")}
              placeholder="Blue Cross, Aetna, United…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="member-id">Member ID</Label>
            <Input
              id="member-id"
              value={form.insurance_member_id}
              onChange={set("insurance_member_id")}
              placeholder="ABC123456789"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
          ) : (
            <><CheckCircle2 className="mr-2 h-4 w-4" /> Submit intake form</>
          )}
        </Button>
      </div>
    </div>
  )
}
