import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Settings" }

const clerkConfigured =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_clerk")

export default async function SettingsPage() {
  let firstName = ""
  let lastName = ""
  let email = ""

  if (clerkConfigured) {
    try {
      const { currentUser } = await import("@clerk/nextjs/server")
      const user = await currentUser()
      firstName = user?.firstName ?? ""
      lastName = user?.lastName ?? ""
      email = user?.emailAddresses?.[0]?.emailAddress ?? ""
    } catch {
      // Clerk not available
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <Card className="border border-border/60">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Profile</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your name and email are managed through your account provider.
          </p>

          <Separator className="my-5" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first-name" className="text-xs">First name</Label>
              <Input
                id="first-name"
                defaultValue={firstName}
                placeholder="—"
                disabled
                className="bg-muted/40 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last-name" className="text-xs">Last name</Label>
              <Input
                id="last-name"
                defaultValue={lastName}
                placeholder="—"
                disabled
                className="bg-muted/40 text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input
                id="email"
                defaultValue={email}
                placeholder="—"
                disabled
                className="bg-muted/40 text-sm"
              />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            To update your name or email, visit your account settings.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border/60">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Appointment reminders and communication preferences — coming soon.
          </p>
          <Button variant="outline" size="sm" className="mt-4" disabled>
            Manage notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
