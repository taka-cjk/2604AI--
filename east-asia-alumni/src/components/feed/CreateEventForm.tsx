"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType, Profile } from "@/types/index"

type Props = {
  userId: string
  onAdd: (event: EventWithOrganizer) => void
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "dinner", label: "Dinner" },
  { value: "study", label: "Study" },
  { value: "networking", label: "Networking" },
  { value: "sports", label: "Sports" },
  { value: "culture", label: "Culture" },
  { value: "other", label: "Other" },
]

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
  })

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
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
      })
      .select()
      .single()

    if (eventError || !event) {
      setError(eventError?.message ?? "イベント作成に失敗しました")
      setLoading(false)
      return
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
        organizer,
        participants_count: 0,
        is_participating: false,
      })
    }

    setForm({ title: "", event_type: "networking", event_date: "", location: "", description: "", max_participants: "" })
    setOpen(false)
    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 py-4 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        + イベントを作成する
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">新しいイベント</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          キャンセル
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">タイトル *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          maxLength={200}
          placeholder="Tokyo Alumni Dinner"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Type + Date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">種類 *</label>
          <select
            value={form.event_type}
            onChange={(e) => update("event_type", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">日時 *</label>
          <input
            type="datetime-local"
            required
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Location + Max participants */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">場所</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="渋谷・オンライン 等"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">最大参加人数</label>
          <input
            type="number"
            min={1}
            value={form.max_participants}
            onChange={(e) => update("max_participants", e.target.value)}
            placeholder="制限なし"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">説明</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={2000}
          placeholder="イベントの詳細を書いてください"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={loading || !form.title.trim() || !form.event_date}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {loading ? "作成中..." : "イベントを作成"}
      </button>
    </form>
  )
}
