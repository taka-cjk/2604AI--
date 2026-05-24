"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType, CommentWithAuthor, Profile } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { MentionInput, renderWithMentions, extractMentionUsernames } from "@/components/ui/MentionInput"

type Props = {
  event: EventWithOrganizer
  userId: string
  onUpdate?: (event: EventWithOrganizer) => void
  onDelete?: (eventId: string) => void
}

type PriceMode = "free" | "actual" | "amount" | "tbd"
type RegMode = "none" | "tbd" | "na" | "url"

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  dinner:     "Dinner",
  study:      "Study",
  networking: "Networking",
  sports:     "Sports",
  culture:    "Culture",
  morning:    "Morning",
  cafe:       "Cafe",
  lunch:      "Lunch",
  other:      "Other",
}

const EVENT_TYPE_COLOR: Record<EventType, string> = {
  dinner:     "bg-indigo-50 text-indigo-700",
  study:      "bg-sky-100 text-sky-700",
  networking: "bg-violet-50 text-violet-700",
  sports:     "bg-emerald-50 text-emerald-700",
  culture:    "bg-pink-50 text-pink-700",
  morning:    "bg-amber-50 text-amber-700",
  cafe:       "bg-orange-50 text-orange-700",
  lunch:      "bg-lime-50 text-lime-700",
  other:      "bg-slate-100 text-slate-600",
}

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

function parsePriceMode(val: string | null): PriceMode {
  if (!val || val === "Free") return "free"
  if (val === "未定" || val === "TBD") return "tbd"
  if (val === "実費" || val === "Actual Cost") return "actual"
  return "amount"
}

function parseRegMode(val: string | null): RegMode {
  if (!val) return "none"
  if (val === "TBD") return "tbd"
  if (val === "NA") return "na"
  return "url"
}

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

function formatPrice(val: string | null): string | null {
  if (!val) return null
  if (val === "Free") return "Free"
  if (val === "未定" || val === "TBD") return "TBD"
  if (val === "実費" || val === "Actual Cost") return "Actual Cost"
  const num = parseInt(val)
  return isNaN(num) ? val : `¥${num.toLocaleString()}`
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function formatEventDate(iso: string) {
  const d = new Date(iso)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const h = d.getHours()
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${months[d.getMonth()]} ${d.getDate()} (${weekdays[d.getDay()]}.), ${hour}:${min} ${ampm}`
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function EventCard({ event, userId, onUpdate, onDelete }: Props) {
  const supabase = createClient()
  const [participating, setParticipating] = useState(event.is_participating ?? false)
  const [count, setCount] = useState(event.participants_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
  const [commentInput, setCommentInput] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({
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
  const [editCohosts, setEditCohosts] = useState<Profile[]>([])
  const [cohostQuery, setCohostQuery] = useState("")
  const [cohostResults, setCohostResults] = useState<Profile[]>([])
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  function startEdit() {
    setEditForm({
      title: event.title,
      event_type: event.event_type as EventType,
      event_date: isoToDatetimeLocal(event.event_date),
      location: event.location ?? "",
      description: event.description ?? "",
      max_participants: event.max_participants?.toString() ?? "",
      price_students_mode: parsePriceMode(event.price_students),
      price_students_amount: (event.price_students && !["Free", "未定", "TBD", "Actual Cost"].includes(event.price_students)) ? event.price_students : "",
      price_other_mode: parsePriceMode(event.price_other),
      price_other_amount: (event.price_other && !["Free", "未定", "TBD", "Actual Cost"].includes(event.price_other)) ? event.price_other : "",
      reg_link_mode: parseRegMode(event.registration_link),
      reg_link_url: (event.registration_link && !["TBD", "NA"].includes(event.registration_link)) ? event.registration_link : "",
    })
    setEditCohosts(event.cohosts ?? [])
    setCohostQuery("")
    setCohostResults([])
    setEditError(null)
    setShowEdit(true)
  }

  function updateEdit(key: keyof typeof editForm, value: string) {
    setEditForm((f) => ({ ...f, [key]: value }))
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
        .neq("id", event.organizer_id)
        .limit(5)
      setCohostResults((data ?? []) as Profile[])
    }, 300)
  }

  function addCohost(profile: Profile) {
    if (!editCohosts.some((c) => c.id === profile.id)) {
      setEditCohosts((prev) => [...prev, profile])
    }
    setCohostQuery("")
    setCohostResults([])
  }

  function removeCohost(id: string) {
    setEditCohosts((prev) => prev.filter((c) => c.id !== id))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editForm.title.trim() || !editForm.event_date) return
    setEditLoading(true)
    setEditError(null)

    const newDate = new Date(editForm.event_date).toISOString()
    const newLocation = editForm.location.trim() || null
    const dateChanged = newDate !== event.event_date
    const locationChanged = newLocation !== event.location

    const { data: updated, error } = await supabase
      .from("events")
      .update({
        title: editForm.title.trim(),
        event_type: editForm.event_type,
        event_date: newDate,
        location: newLocation,
        description: editForm.description.trim() || null,
        max_participants: editForm.max_participants ? parseInt(editForm.max_participants) : null,
        price_students: toPriceDb(editForm.price_students_mode, editForm.price_students_amount),
        price_other: toPriceDb(editForm.price_other_mode, editForm.price_other_amount),
        registration_link: toRegDb(editForm.reg_link_mode, editForm.reg_link_url),
      })
      .eq("id", event.id)
      .select()
      .single()

    if (error || !updated) {
      setEditError(error?.message ?? "Failed to update")
      setEditLoading(false)
      return
    }

    // コホストの差分更新
    const originalIds = new Set((event.cohosts ?? []).map((c) => c.id))
    const newIds = new Set(editCohosts.map((c) => c.id))
    const toRemove = [...originalIds].filter((id) => !newIds.has(id))
    const toAdd = [...newIds].filter((id) => !originalIds.has(id))

    await Promise.all([
      toRemove.length > 0
        ? supabase.from("event_cohosts").delete().eq("event_id", event.id).in("user_id", toRemove)
        : Promise.resolve(),
      toAdd.length > 0
        ? supabase.from("event_cohosts").insert(toAdd.map((id) => ({ event_id: event.id, user_id: id })))
        : Promise.resolve(),
    ])

    // 日時または場所が変わった場合、参加者に通知
    if (dateChanged || locationChanged) {
      const { data: participants } = await supabase
        .from("event_participants")
        .select("user_id")
        .eq("event_id", event.id)
        .neq("user_id", userId)
      if (participants && participants.length > 0) {
        await supabase.from("notifications").insert(
          participants.map((p) => ({
            user_id: p.user_id,
            actor_id: userId,
            type: "event_update" as const,
            entity_id: event.id,
          }))
        )
      }
    }

    if (onUpdate) {
      onUpdate({
        ...event,
        ...updated,
        event_type: updated.event_type as EventType,
        price_students: updated.price_students ?? null,
        price_other: updated.price_other ?? null,
        registration_link: updated.registration_link ?? null,
        organizer: event.organizer,
        cohosts: editCohosts,
        participants_count: count,
        is_participating: participating,
      })
    }

    setShowEdit(false)
    setEditLoading(false)
  }

  async function toggleComments() {
    setShowComments((v) => !v)
    if (!commentsLoaded) {
      const { data } = await supabase
        .from("comments")
        .select("*, author:profiles!comments_author_id_fkey(*)")
        .eq("event_id", event.id)
        .order("created_at", { ascending: true })
      const loaded = (data ?? []) as CommentWithAuthor[]
      setComments(loaded)
      setCommentsCount(loaded.length)
      setCommentsLoaded(true)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentInput.trim() || commentSubmitting) return
    setCommentSubmitting(true)
    const { data } = await supabase
      .from("comments")
      .insert({ event_id: event.id, author_id: userId, content: commentInput.trim() })
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .single()
    if (data) {
      setComments((prev) => [...prev, data as CommentWithAuthor])
      setCommentsCount((c) => c + 1)

      // @メンション通知
      const usernames = extractMentionUsernames(commentInput)
      if (usernames.length > 0) {
        const { data: mentioned } = await supabase
          .from("profiles")
          .select("id")
          .in("username", usernames)
          .neq("id", userId)
        if (mentioned && mentioned.length > 0) {
          await supabase.from("notifications").insert(
            mentioned.map((p) => ({
              user_id: p.id,
              actor_id: userId,
              type: "mention" as const,
              entity_id: data.id,
            }))
          )
        }
      }

      setCommentInput("")
    }
    setCommentSubmitting(false)
  }

  async function toggleParticipation() {
    const next = !participating
    setParticipating(next)
    setCount((c) => c + (next ? 1 : -1))
    if (next) {
      await supabase.from("event_participants").insert({ event_id: event.id, user_id: userId })
    } else {
      await supabase.from("event_participants").delete().eq("event_id", event.id).eq("user_id", userId)
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this event? This cannot be undone.")) return
    setDeleteLoading(true)
    await supabase.from("events").update({ deleted_at: new Date().toISOString() }).eq("id", event.id)
    onDelete?.(event.id)
    setDeleteLoading(false)
  }

  const isDeleted = !!event.deleted_at
  const isFull = event.max_participants !== null && count >= event.max_participants && !participating
  const isOrganizer = userId === event.organizer_id
  const cohostIds = new Set((event.cohosts ?? []).map((c) => c.id))
  const canDelete = !isDeleted && (isOrganizer || cohostIds.has(userId))

  const priceStudents = formatPrice(event.price_students)
  const priceOther = formatPrice(event.price_other)
  const showPrice = priceStudents || priceOther

  return (
    <article className="rounded-xl border border-slate-200 border-l-4 border-l-amber-400 bg-white px-5 py-4 flex flex-col gap-3">
      {showEdit ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Edit event</p>
            <button type="button" onClick={() => setShowEdit(false)} className="text-xs text-slate-400 hover:text-slate-600">
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Title *</label>
            <input type="text" required value={editForm.title} onChange={(e) => updateEdit("title", e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
              <select value={editForm.event_type} onChange={(e) => updateEdit("event_type", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date & time *</label>
              <input type="datetime-local" required value={editForm.event_date}
                onChange={(e) => updateEdit("event_date", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
              <input type="text" value={editForm.location} onChange={(e) => updateEdit("location", e.target.value)}
                placeholder="Shibuya, Online, etc."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Max attendees</label>
              <input type="number" min={1} value={editForm.max_participants}
                onChange={(e) => updateEdit("max_participants", e.target.value)} placeholder="No limit"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Price edit */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Fee</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">Students</p>
                <div className="flex gap-1.5">
                  <select value={editForm.price_students_mode} onChange={(e) => updateEdit("price_students_mode", e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                    <option value="free">Free</option>
                    <option value="actual">Actual Cost</option>
                    <option value="amount">Fixed price</option>
                    <option value="tbd">TBD</option>
                  </select>
                  {editForm.price_students_mode === "amount" && (
                    <input type="number" min={0} value={editForm.price_students_amount}
                      onChange={(e) => updateEdit("price_students_amount", e.target.value)} placeholder="1500"
                      className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">General</p>
                <div className="flex gap-1.5">
                  <select value={editForm.price_other_mode} onChange={(e) => updateEdit("price_other_mode", e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                    <option value="free">Free</option>
                    <option value="actual">Actual Cost</option>
                    <option value="amount">Fixed price</option>
                    <option value="tbd">TBD</option>
                  </select>
                  {editForm.price_other_mode === "amount" && (
                    <input type="number" min={0} value={editForm.price_other_amount}
                      onChange={(e) => updateEdit("price_other_amount", e.target.value)} placeholder="2000"
                      className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Registration link edit */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Registration link</label>
            <div className="flex gap-1.5 items-center flex-wrap">
              <select value={editForm.reg_link_mode} onChange={(e) => updateEdit("reg_link_mode", e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500">
                <option value="none">None</option>
                <option value="tbd">TBD</option>
                <option value="na">NA (no registration required)</option>
                <option value="url">Enter URL</option>
              </select>
              {editForm.reg_link_mode === "url" && (
                <input type="url" value={editForm.reg_link_url}
                  onChange={(e) => updateEdit("reg_link_url", e.target.value)} placeholder="https://..."
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Co-hosts edit */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Co-hosts</label>
            {editCohosts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editCohosts.map((c) => (
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
              {cohostResults.filter((r) => !editCohosts.some((c) => c.id === r.id)).length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
                  {cohostResults
                    .filter((r) => !editCohosts.some((c) => c.id === r.id))
                    .map((r) => (
                      <button key={r.id} type="button" onClick={() => addCohost(r)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50 text-left">
                        <span className="font-medium text-slate-800">{r.full_name}</span>
                        <span className="text-slate-400">@{r.username}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
            <textarea rows={2} value={editForm.description} onChange={(e) => updateEdit("description", e.target.value)}
              maxLength={2000}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {editError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{editError}</p>}

          <button type="submit" disabled={editLoading || !editForm.title.trim() || !editForm.event_date}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
            {editLoading ? "Saving..." : "Save"}
          </button>
        </form>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_TYPE_COLOR[event.event_type as EventType]}`}>
                  {EVENT_TYPE_LABEL[event.event_type as EventType]}
                </span>
                {isDeleted && (
                  <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-500">
                    Deleted
                  </span>
                )}
              </div>
              <h3 className={`text-base font-semibold leading-snug ${isDeleted ? "text-slate-400 line-through" : "text-slate-900"}`}>
                {event.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isOrganizer && !isDeleted && (
                <button onClick={startEdit} className="text-xs text-slate-400 hover:text-indigo-600 transition-colors">
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                >
                  {deleteLoading ? "..." : "Delete"}
                </button>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              <span>{formatEventDate(event.event_date)}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            )}
            {showPrice && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                <span>
                  {priceStudents && `Students ${priceStudents}`}
                  {priceStudents && priceOther && " / "}
                  {priceOther && `General ${priceOther}`}
                </span>
              </div>
            )}
            {event.registration_link && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                {event.registration_link === "TBD" ? (
                  <span className="text-slate-400">Registration link: TBD</span>
                ) : event.registration_link === "NA" ? (
                  <span>No registration required</span>
                ) : (
                  <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    Register here ↗
                  </a>
                )}
              </div>
            )}
            {event.description && (
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">{event.description}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span>
                  {count} attending{event.max_participants ? ` / max ${event.max_participants}` : ""}
                </span>
                <span className="text-slate-300">·</span>
                <span>Host: @{event.organizer.username}</span>
              </div>
              {(event.cohosts ?? []).length > 0 && (
                <p className="text-xs text-slate-400 pl-5">
                  Co-hosts: {event.cohosts.map((c) => `@${c.username}`).join(", ")}
                </p>
              )}
              {(event.participants ?? []).length > 0 && (
                <p className="text-xs text-slate-400 pl-5">
                  Attendees: {event.participants.map((p) => `@${p.username}`).join(", ")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleComments}
                className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? "text-indigo-500" : "text-slate-400 hover:text-indigo-400"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
              </button>

              {!isDeleted && (
                <button
                  onClick={toggleParticipation}
                  disabled={isFull}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    participating
                      ? "bg-indigo-50 text-indigo-600 hover:bg-red-50 hover:text-red-600"
                      : isFull
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {participating ? "Going (Cancel)" : isFull ? "Full" : "Join"}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* コメントセクション */}
      {!showEdit && !isDeleted && showComments && (
        <div className="flex flex-col gap-3 pt-1 border-t border-slate-100">
          {comments.length > 0 && (
            <div className="flex flex-col gap-2">
              {comments.map((c) => {
                const isHost = c.author_id === event.organizer_id || cohostIds.has(c.author_id)
                return (
                  <div
                    key={c.id}
                    className={`flex gap-2.5 ${isHost ? "rounded-lg bg-purple-50 px-2.5 py-2 -mx-2.5" : ""}`}
                  >
                    <Link href={`/profile/${c.author_id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                      <Avatar name={c.author.full_name} avatarUrl={c.author.avatar_url} size="xs" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${c.author_id}`} className="hover:underline inline-flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800">{c.author.full_name}</span>
                        {isHost && (
                          <span className="text-[10px] font-medium text-purple-600 bg-purple-100 rounded-full px-1.5 py-0.5 leading-none">Host</span>
                        )}
                      </Link>
                      <span className="text-xs text-slate-400 ml-1.5">{formatDate(c.created_at)}</span>
                      <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                        {renderWithMentions(c.content)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <form onSubmit={handleAddComment} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-col gap-2">
            <MentionInput
              value={commentInput}
              onChange={setCommentInput}
              placeholder="Add a comment... (@mention)"
              className="w-full resize-none text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed min-h-[48px]"
              disabled={commentSubmitting}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentInput.trim() || commentSubmitting}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  )
}
