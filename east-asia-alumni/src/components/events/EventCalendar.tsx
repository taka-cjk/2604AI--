"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType } from "@/types/index"
import { EventCard } from "@/components/feed/EventCard"

// ── Constants ──────────────────────────────────────────────────────────────

const LOCATION_OPTIONS = ["Tokyo", "Beijing", "Seoul", "Shanghai", "Hong Kong", "Taipei", "Singapore", "Online"]

const LOCATION_KEYWORDS: Record<string, string[]> = {
  "Tokyo":     ["tokyo", "東京"],
  "Beijing":   ["beijing", "北京"],
  "Seoul":     ["seoul", "ソウル", "서울"],
  "Shanghai":  ["shanghai", "上海"],
  "Hong Kong": ["hong kong", "hongkong", "香港"],
  "Taipei":    ["taipei", "台北"],
  "Singapore": ["singapore", "シンガポール"],
  "Online":    ["online", "オンライン"],
}

const CATEGORY_OPTIONS: { value: EventType; label: string }[] = [
  { value: "dinner",     label: "Dinner" },
  { value: "study",      label: "Study" },
  { value: "networking", label: "Networking" },
  { value: "sports",     label: "Sports" },
  { value: "culture",    label: "Culture" },
  { value: "morning",    label: "Morning" },
  { value: "cafe",       label: "Cafe" },
  { value: "lunch",      label: "Lunch" },
  { value: "other",      label: "Other" },
]

const TIME_OPTIONS = [
  { value: "morning",   label: "Morning (–12:00)" },
  { value: "afternoon", label: "Afternoon (12:00–17:00)" },
  { value: "evening",   label: "Evening (17:00–)" },
]

const TYPE_COLORS: Record<EventType, string> = {
  dinner:     "bg-indigo-50 text-indigo-700",
  study:      "bg-sky-50 text-sky-700",
  networking: "bg-violet-50 text-violet-700",
  sports:     "bg-emerald-50 text-emerald-700",
  culture:    "bg-pink-50 text-pink-700",
  morning:    "bg-amber-50 text-amber-700",
  cafe:       "bg-orange-50 text-orange-700",
  lunch:      "bg-lime-50 text-lime-700",
  other:      "bg-slate-100 text-slate-600",
}

const TYPE_LABELS: Record<EventType, string> = {
  dinner: "Dinner", study: "Study", networking: "Networking",
  sports: "Sports", culture: "Culture", morning: "Morning",
  cafe: "Cafe", lunch: "Lunch", other: "Other",
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// ── Helpers ────────────────────────────────────────────────────────────────

function getTimeSlot(eventDateIso: string): "morning" | "afternoon" | "evening" {
  const h = new Date(eventDateIso).getHours()
  if (h < 12) return "morning"
  if (h < 17) return "afternoon"
  return "evening"
}

function matchesLocation(eventLocation: string | null, selected: string[]): boolean {
  if (selected.length === 0) return true
  if (!eventLocation) return false
  const loc = eventLocation.toLowerCase()
  return selected.some((s) => LOCATION_KEYWORDS[s]?.some((kw) => loc.includes(kw)))
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${hour}:${min} ${ampm}`
}

// ── FilterDropdown ─────────────────────────────────────────────────────────

function FilterDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (v: T[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function toggle(v: T) {
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  }

  const displayLabel =
    selected.length === 0
      ? label
      : selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${label} (${selected.length})`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
          selected.length > 0
            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        }`}
      >
        {displayLabel}
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 top-full mt-1 min-w-[170px] rounded-lg border border-slate-200 bg-white shadow-lg py-1">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-700">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── CompactEventItem (calendar detail panel) ───────────────────────────────

function CompactEventItem({
  event,
  userId,
  onParticipationChange,
}: {
  event: EventWithOrganizer
  userId: string
  onParticipationChange: (eventId: string, participating: boolean, delta: number) => void
}) {
  const supabase = createClient()
  const [participating, setParticipating] = useState(event.is_participating ?? false)
  const [count, setCount] = useState(event.participants_count)
  const isFull = event.max_participants !== null && count >= event.max_participants && !participating

  async function toggle() {
    const next = !participating
    setParticipating(next)
    setCount((c) => c + (next ? 1 : -1))
    onParticipationChange(event.id, next, next ? 1 : -1)
    if (next) {
      await supabase.from("event_participants").insert({ event_id: event.id, user_id: userId })
    } else {
      await supabase.from("event_participants").delete().eq("event_id", event.id).eq("user_id", userId)
    }
  }

  const typeColor = TYPE_COLORS[event.event_type as EventType] ?? TYPE_COLORS.other
  const typeLabel = TYPE_LABELS[event.event_type as EventType] ?? event.event_type

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
            {typeLabel}
          </span>
          <span className="text-xs text-slate-400">{formatTime(event.event_date)}</span>
        </div>
        <p className="text-sm font-semibold text-slate-900 leading-snug">{event.title}</p>
        {event.location && (
          <p className="text-xs text-slate-500 mt-0.5">{event.location}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          {count} attending{event.max_participants ? ` / max ${event.max_participants}` : ""} · Host: @{event.organizer.username}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={isFull}
        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
          participating
            ? "bg-indigo-50 text-indigo-600 hover:bg-red-50 hover:text-red-600"
            : isFull
            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {participating ? "Going (Cancel)" : isFull ? "Full" : "Join"}
      </button>
    </div>
  )
}

// ── EventCalendar (main) ───────────────────────────────────────────────────

type ViewMode = "calendar" | "list"

export function EventCalendar({
  events: initialEvents,
  userId,
  onUpdate,
}: {
  events: EventWithOrganizer[]
  userId: string
  onUpdate?: (event: EventWithOrganizer) => void
}) {
  const today = new Date()
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<EventType[]>([])
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [events, setEvents] = useState(initialEvents)

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
    setSelectedDate(null)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
    setSelectedDate(null)
  }

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!matchesLocation(e.location, selectedLocations)) return false
      if (selectedCategories.length > 0 && !selectedCategories.includes(e.event_type as EventType)) return false
      if (selectedTimes.length > 0 && !selectedTimes.includes(getTimeSlot(e.event_date))) return false
      return true
    })
  }, [events, selectedLocations, selectedCategories, selectedTimes])

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventWithOrganizer[]> = {}
    filteredEvents.forEach((e) => {
      const date = e.event_date.slice(0, 10)
      if (!map[date]) map[date] = []
      map[date].push(e)
    })
    return map
  }, [filteredEvents])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today.toISOString().slice(0, 10)

  function dateStr(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
  }

  function handleLocalUpdate(updated: EventWithOrganizer) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    onUpdate?.(updated)
  }

  function handleParticipationChange(eventId: string, participating: boolean, delta: number) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, is_participating: participating, participants_count: e.participants_count + delta }
          : e
      )
    )
  }

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []
  const hasActiveFilter = selectedLocations.length > 0 || selectedCategories.length > 0 || selectedTimes.length > 0

  // List view: filtered events sorted by event_date
  const sortedFilteredEvents = useMemo(
    () => [...filteredEvents].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()),
    [filteredEvents]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar: filters + view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Location"
          options={LOCATION_OPTIONS.map((l) => ({ value: l, label: l }))}
          selected={selectedLocations}
          onChange={setSelectedLocations}
        />
        <FilterDropdown
          label="Category"
          options={CATEGORY_OPTIONS}
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
        <FilterDropdown
          label="Time"
          options={TIME_OPTIONS}
          selected={selectedTimes}
          onChange={setSelectedTimes}
        />
        {hasActiveFilter && (
          <button
            onClick={() => {
              setSelectedLocations([])
              setSelectedCategories([])
              setSelectedTimes([])
            }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5 transition-colors"
          >
            Clear
          </button>
        )}

        {/* View toggle */}
        <div className="ml-auto flex rounded-lg border border-slate-200 overflow-hidden">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200 ${
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            List
          </button>
        </div>
      </div>

      {/* ── Calendar View ───────────────────────────────────────────────── */}
      {viewMode === "calendar" && (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm font-semibold text-slate-800">
                {MONTH_NAMES[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 border-b border-slate-100">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className={`py-2 text-center text-xs font-medium ${
                    d === "Sun" ? "text-red-400" : d === "Sat" ? "text-blue-400" : "text-slate-400"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="border-r border-b border-slate-50 min-h-[80px]" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1
                const ds = dateStr(d)
                const isToday = ds === todayStr
                const isSelected = ds === selectedDate
                const dayEvents = eventsByDate[ds] ?? []
                const dayOfWeek = (firstDay + i) % 7

                return (
                  <div
                    key={d}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className={`border-r border-b border-slate-100 min-h-[80px] p-1.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday && isSelected
                            ? "bg-indigo-600 text-white"
                            : isToday
                            ? "ring-2 ring-indigo-400 text-indigo-700"
                            : isSelected
                            ? "bg-indigo-100 text-indigo-700"
                            : dayOfWeek === 0
                            ? "text-red-400"
                            : dayOfWeek === 6
                            ? "text-blue-400"
                            : "text-slate-600"
                        }`}
                      >
                        {d}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight truncate ${
                            TYPE_COLORS[e.event_type as EventType] ?? TYPE_COLORS.other
                          }`}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected date events */}
          {selectedDate && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-slate-700">
                {(() => {
                  const d = new Date(selectedDate + "T00:00:00")
                  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
                  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
                  return `${months[d.getMonth()]} ${d.getDate()} (${weekdays[d.getDay()]}.) — Events`
                })()}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No events on this day</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedEvents.map((e) => (
                    <CompactEventItem
                      key={e.id}
                      event={e}
                      userId={userId}
                      onParticipationChange={handleParticipationChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── List View ───────────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4">
          {sortedFilteredEvents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              {hasActiveFilter ? "No events match the filters" : "No upcoming events"}
            </p>
          ) : (
            sortedFilteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                userId={userId}
                onUpdate={handleLocalUpdate}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
