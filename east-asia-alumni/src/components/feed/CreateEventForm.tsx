"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType, Profile } from "@/types/index"

type Props = {
  userId: string
  onAdd: (event: EventWithOrganizer) => void
}

type PriceMode = "free" | "actual" | "amount" | "tbd"
type RegMode = "none" | "tbd" | "na" | "url"

const EVENT_TYPES: { value: EventType; label: string }[] = [
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

function toPriceDb(mode: PriceMode, amount: string): string | null {
  if (mode === "free") return "Free"
  if (mode === "tbd") return "TBD"
  if (mode === "actual") return "Actual Cost"
  return amount.trim() || null
}

function toRegDb(mode: RegMode, url: string): string | null {
  if (mode === "none") return null
  if (mode === "tbd") return "TBD"
  if (mode === "na") return "NA"
  return url.trim() || null
}

export function CreateEventForm({ userId, onAdd }: Props) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: "",
    event_type: "networking" as EventType,
    event_date: "",
    location: "",
    description: "",
    max_participants: "",
    price_students_mode: "free" as PriceMode,
    price_students_amount: "",
    price_other_mode: "free" as PriceMode,
    price_other_amount: "",
    reg_link_mode: "none" as RegMode,
    reg_link_url: "",
  })

  const [cohosts, setCohosts] = useState<Profile[]>([])
  const [cohostQuery, setCohostQuery] = useState("")
  const [cohostResults, setCohostResults] = useState<Profile[]>([])
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleCohostSearch(q: string) {
    setCohostQuery(q)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setCohostResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq("id", userId)
        .limit(5)
      setCohostResults((data ?? []) as Profile[])
    }, 300)
  }

  function addCohost(profile: Profile) {
    if (!cohosts.some((c) => c.id === profile.id)) {
      setCohosts((prev) => [...prev, profile])
    }
    setCohostQuery("")
    setCohostResults([])
  }

  function removeCohost(id: string) {
    setCohosts((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.event_date) return
    setError(null)
    setLoading(true)

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        organizer_id: userId,
        title: form.title.trim(),
        event_type: form.event_type,
        event_date: new Date(form.event_date).toISOString(),
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        price_students: toPriceDb(form.price_students_mode, form.price_students_amount),
        price_other: toPriceDb(form.price_other_mode, form.price_other_amount),
        registration_link: toRegDb(form.reg_link_mode, form.reg_link_url),
      })
      .select()
      .single()

    if (eventError || !event) {
      setError(eventError?.message ?? "Failed to create event")
      setLoading(false)
      return
    }

    if (cohosts.length > 0) {
      await supabase.from("event_cohosts").insert(
        cohosts.map((c) => ({ event_id: event.id, user_id: c.id }))
      )
    }

    const { data: allProfiles } = await supabase.from("profiles").select("id")
    const targets = (allProfiles ?? []).filter((p) => p.id !== userId)
    if (targets.length > 0) {
      await supabase.from("notifications").insert(
        targets.map((p) => ({
          user_id: p.id,
          actor_id: userId,
          type: "event_new" as const,
          entity_id: event.id,
        }))
      )
    }

    const { data: organizer } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>()

    if (organizer) {
      onAdd({
        ...event,
        event_type: event.event_type as EventType,
        price_students: event.price_students ?? null,
        price_other: event.price_other ?? null,
        registration_link: event.registration_link ?? null,
        deleted_at: null,
        organizer,
        cohosts,
        participants_count: 0,
        is_participating: false,
      })
    }

    setForm({
      title: "", event_type: "networking", event_date: "", location: "", description: "",
      max_participants: "",
      price_students_mode: "free", price_students_amount: "",
      price_other_mode: "free", price_other_amount: "",
      reg_link_mode: "none", reg_link_url: "",
    })
    setCohosts([])
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 py-4 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        + Create an event
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">New event</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
        <input
          type="text" required value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={200} placeholder="Tokyo Alumni Dinner"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Type + Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
          <select value={form.event_type} onChange={(e) => update("event_type", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Date & time *</label>
          <input type="datetime-local" required value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Location + Max */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
          <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
            placeholder="Shibuya, Online, etc."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Max attendees</label>
          <input type="number" min={1} value={form.max_participants}
            onChange={(e) => update("max_participants", e.target.value)} placeholder="No limit"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Fee</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">Students</p>
            <div className="flex gap-1.5">
              <select value={form.price_students_mode} onChange={(e) => update("price_students_mode", e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                <option value="free">Free</option>
                <option value="actual">Actual Cost</option>
                <option value="amount">Fixed price</option>
                <option value="tbd">TBD</option>
              </select>
              {form.price_students_mode === "amount" && (
                <input type="number" min={0} value={form.price_students_amount}
                  onChange={(e) => update("price_students_amount", e.target.value)} placeholder="1500"
                  className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">General</p>
            <div className="flex gap-1.5">
              <select value={form.price_other_mode} onChange={(e) => update("price_other_mode", e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                <option value="free">Free</option>
                <option value="actual">Actual Cost</option>
                <option value="amount">Fixed price</option>
                <option value="tbd">TBD</option>
              </select>
              {form.price_other_mode === "amount" && (
                <input type="number" min={0} value={form.price_other_amount}
                  onChange={(e) => update("price_other_amount", e.target.value)} placeholder="2000"
                  className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Link */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Registration link</label>
        <div className="flex gap-1.5 items-center flex-wrap">
          <select value={form.reg_link_mode} onChange={(e) => update("reg_link_mode", e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
            <option value="none">None</option>
            <option value="tbd">TBD</option>
            <option value="na">NA (no registration required)</option>
            <option value="url">Enter URL</option>
          </select>
          {form.reg_link_mode === "url" && (
            <input type="url" value={form.reg_link_url}
              onChange={(e) => update("reg_link_url", e.target.value)} placeholder="https://..."
              className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
            />
          )}
        </div>
      </div>

      {/* Co-hosts */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">Co-hosts</label>
        {cohosts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {cohosts.map((c) => (
              <span key={c.id} className="flex items-center gap-1 bg-purple-50 text-purple-700 rounded-full px-2.5 py-1 text-xs font-medium">
                @{c.username}
                <button type="button" onClick={() => removeCohost(c.id)} className="text-purple-400 hover:text-purple-700 leading-none">×</button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            type="text"
            value={cohostQuery}
            onChange={(e) => handleCohostSearch(e.target.value)}
            placeholder="Search by username or name..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {cohostResults.filter((r) => !cohosts.some((c) => c.id === r.id)).length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
              {cohostResults
                .filter((r) => !cohosts.some((c) => c.id === r.id))
                .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => addCohost(r)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50 text-left"
                  >
                    <span className="font-medium text-slate-800">{r.full_name}</span>
                    <span className="text-slate-400">@{r.username}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)}
          maxLength={2000} placeholder="Describe the event"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" disabled={loading || !form.title.trim() || !form.event_date}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
        {loading ? "Creating..." : "Create event"}
      </button>
    </form>
  )
}
