"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { saveProvider } from "@/lib/actions/providers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

type Props = {
  provider?: {
    id: string
    name: string
    title: string | null
    bio: string | null
    npi: string | null
    specialties: string[]
    is_active: boolean
  }
}

export function ProviderForm({ provider }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(provider?.name ?? "")
  const [title, setTitle] = useState(provider?.title ?? "")
  const [bio, setBio] = useState(provider?.bio ?? "")
  const [npi, setNpi] = useState(provider?.npi ?? "")
  const [specialties, setSpecialties] = useState<string[]>(provider?.specialties ?? [])
  const [specialtyInput, setSpecialtyInput] = useState("")
  const [isActive, setIsActive] = useState(provider?.is_active ?? true)

  function addSpecialty() {
    const val = specialtyInput.trim()
    if (val && !specialties.includes(val)) {
      setSpecialties((prev) => [...prev, val])
    }
    setSpecialtyInput("")
  }

  function removeSpecialty(s: string) {
    setSpecialties((prev) => prev.filter((x) => x !== s))
  }

  function handleSpecialtyKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addSpecialty()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required.")
      return
    }
    startTransition(async () => {
      const result = await saveProvider({
        id: provider?.id,
        name,
        title,
        bio,
        npi,
        specialties,
        is_active: isActive,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(provider ? "Provider updated." : "Provider created.")
        router.push("/admin/providers")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity */}
      <Card className="border border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Provider details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                placeholder="Dr. Jane Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title / credential</Label>
              <Input
                id="title"
                placeholder="MD, Family Medicine"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Brief provider biography shown to patients..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="npi">NPI number</Label>
            <Input
              id="npi"
              placeholder="1234567890"
              value={npi}
              onChange={(e) => setNpi(e.target.value)}
              maxLength={10}
            />
          </div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card className="border border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Specialties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Family Medicine (press Enter to add)"
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyDown={handleSpecialtyKeyDown}
            />
            <Button type="button" variant="outline" onClick={addSpecialty}>
              Add
            </Button>
          </div>
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {specialties.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--clinic-accent)] px-3 py-1 text-xs font-medium text-[var(--clinic-primary)]"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(s)}
                    className="hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border border-border/60">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted-foreground">
              Inactive providers are hidden from booking
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-[var(--clinic-primary)] text-white hover:opacity-90"
        >
          {isPending ? "Saving…" : provider ? "Save changes" : "Create provider"}
        </Button>
      </div>
    </form>
  )
}
