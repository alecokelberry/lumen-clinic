import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Lumen Clinic — Modern Medical Care",
    template: "%s | Lumen Clinic",
  },
  description: "Book appointments, message your care team, and manage your health — all in one place.",
}

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Only wrap with ClerkProvider when a real key is configured.
  // This lets the app run locally before Clerk credentials are added.
  if (clerkKey && !clerkKey.includes("your_clerk")) {
    const { ClerkProvider } = await import("@clerk/nextjs")
    return (
      <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            {children}
          </body>
        </html>
      </ClerkProvider>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
