import type { Metadata } from "next"
import { Outfit } from "next/font/google"
import "./globals.css"
import { ClerkProviderWrapper } from "@/components/clerk-provider"

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
const clerkConfigured = clerkKey && !clerkKey.includes("your_clerk")

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const bodyClass = `${outfit.variable} antialiased`
  const html = (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClass}>{children}</body>
    </html>
  )

  if (clerkConfigured) {
    return <ClerkProviderWrapper>{html}</ClerkProviderWrapper>
  }

  return html
}
