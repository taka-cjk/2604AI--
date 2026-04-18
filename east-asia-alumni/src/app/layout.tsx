import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "East Asia Alumni Network",
  description: "A community for East Asian exchange program alumni",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="h-full bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
