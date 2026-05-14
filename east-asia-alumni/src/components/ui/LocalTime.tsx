"use client"

export function LocalTime({ iso }: { iso: string }) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const formatted = isToday
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" })
  return <span suppressHydrationWarning>{formatted}</span>
}
