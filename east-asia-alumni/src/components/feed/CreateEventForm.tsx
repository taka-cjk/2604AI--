"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType, Profile } from "@/types/index"

type Props = {
  userId: string
  onAdd: (event: EventWithOrganizer) => void
}

type PriceMode = "none" | "tbd" | "amount"
type RegMode = "none" | "tbd" | "na" | "url"

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "dinner", label: "Dinner" },
  { value: "study", label: "Study" },
  { value: "networking", label: "Networking" },
  { value: "sports", label: "Sports" },
  { value: "culture", label: "Culture" },
  { value: "other", label: "Other" },
]

function toPriceDb(mode: PriceMode, amount: string): string | null {
  if (mode === "none") return null
  if (mode === "tbd") return "未定"
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
    price_students_mode: "none" as PriceMode,
    price_students_amount: "",
    price_other_mode: "none" as PriceMode,
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
      setError(eventError?.message ?? "イベント作成に失敗しました")
      setLoading(false)
      return
    }

    if (cohosts.length > 0) {
      await supabase.from("event_cohosts").insert(
        cohosts.map((c) => ({ event_id: event.id, user_id: c.id }))
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
        organizer,
        cohosts,
        participants_count: 0,
        is_participating: false,
      })
    }

    setForm({
      title: "", event_type: "networking", event_date: "", location: "", description: "",
      max_participants: "",
      price_students_mode: "none", price_students_amount: "",
      price_other_mode: "none", price_other_amount: "",
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
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
          キャンセル
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">タイトル *</label>
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
          <label className="block text-xs font-medium text-slate-600 mb-1">種類 *</label>
          <select value={form.event_type} onChange={(e) => update("event_type", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">日時 *</label>
          <input type="datetime-local" required value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Location + Max */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">場所</label>
          <input type="text" value={form.location} onChange={(e) => update("location", e.target.value)}
            placeholder="渋谷・オンライン 等"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">最大参加人数</label>
          <input type="number" min={1} value={form.max_participants}
            onChange={(e) => update("max_participants", e.target.value)} placeholder="制限なし"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-2">参加費</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500 mb-1">学生</p>
            <div className="flex gap-1.5">
              <select value={form.price_students_mode} onChange={(e) => update("price_students_mode", e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                <option value="none">なし</option>
                <option value="tbd">未定</option>
                <option value="amount">金額</option>
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
            <p className="text-xs text-slate-500 mb-1">一般</p>
            <div className="flex gap-1.5">
              <select value={form.price_other_mode} onChange={(e) => update("price_other_mode", e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                <option value="none">なし</option>
                <option value="tbd">未定</option>
                <option value="amount">金額</option>
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
        <label className="block text-xs font-medium text-slate-600 mb-1">登録リンク</label>
        <div className="flex gap-1.5 items-center flex-wrap">
          <select value={form.reg_link_mode} onChange={(e) => update("reg_link_mode", e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
            <option value="none">なし</option>
            <option value="tbd">TBD</option>
            <option value="na">NA（登録不要）</option>
            <option value="url">URLを入力</option>
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
        <label className="block text-xs font-medium text-slate-600 mb-2">共同ホスト</label>
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
            placeholder="ユーザー名・名前で検索..."
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
        <label className="block text-xs font-medium text-slate-600 mb-1">説明</label>
        <textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)}
          maxLength={2000} placeholder="イベントの詳細を書いてください"
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" disabled={loading || !form.title.trim() || !form.event_date}
        className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
        {loading ? "作成中..." : "イベントを作成"}
      </button>
    </form>
  )
}
