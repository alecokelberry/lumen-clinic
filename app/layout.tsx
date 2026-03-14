import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
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
  const bodyClass = `${outfit.variable} antialiased`

  if (clerkKey && !clerkKey.includes("your_clerk")) {
    const { ClerkProvider } = await import("@clerk/nextjs")
    return (
      <ClerkProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={bodyClass}>{children}</body>
        </html>
      </ClerkProvider>
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClass}>{children}</body>
    </html>
  )
}
