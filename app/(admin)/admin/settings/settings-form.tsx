"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { updateClinicSettings } from "@/lib/actions/clinic"
import { TIMEZONE_OPTIONS } from "@/lib/tz"

interface Props {
  clinicId: string
  initialName: string
  initialTagline: string
  initialPrimary: string
  initialAccent: string
  initialTimezone: string
}

export function SettingsForm({
  initialName,
  initialTagline,
  initialPrimary,
  initialAccent,
  initialTimezone,
}: Props) {
  const [name, setName] = useState(initialName)
  const [tagline, setTagline] = useState(initialTagline)
  const [primary, setPrimary] = useState(initialPrimary)
  const [accent, setAccent] = useState(initialAccent)
  const [timezone, setTimezone] = useState(initialTimezone)
  const [isPending, startTransition] = useTransition()

  const isDirty =
    name !== initialName ||
    tagline !== initialTagline ||
    primary !== initialPrimary ||
    accent !== initialAccent ||
    timezone !== initialTimezone

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Clinic name is required.")
      return
    }
    startTransition(async () => {
      const result = await updateClinicSettings({
        name,
        tagline,
        primary_color: primary,
        accent_color: accent,
        timezone,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Settings saved.")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Clinic identity */}
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Clinic identity</CardTitle>
          <CardDescription>Name and tagline shown across the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Clinic name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Lumen Clinic"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Modern care for every patient."
              maxLength={160}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Timezone</CardTitle>
          <CardDescription>All appointment times are displayed in this timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {TIMEZONE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Brand colors */}
      <Card className="border border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Brand colors</CardTitle>
          <CardDescription>
            Primary is used for buttons and accents. Accent is used for badges and highlights.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="primary">Primary color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
                <Input
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="font-mono text-sm uppercase"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              <Label htmlFor="accent">Accent color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accent"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
                />
                <Input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="font-mono text-sm uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-border/60 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</p>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                Book appointment
              </button>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: accent, color: primary }}
              >
                Confirmed
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: primary }}
              >
                {name || "Clinic name"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!isDirty || isPending}
          className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
        >
          {isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
          ) : (
            <><Save className="mr-2 h-4 w-4" /> Save changes</>
          )}
        </Button>
      </div>
    </div>
  )
}
