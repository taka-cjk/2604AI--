"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType } from "@/types/index"

type Props = {
  event: EventWithOrganizer
  userId: string
}

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  dinner: "Dinner",
  study: "Study",
  networking: "Networking",
  sports: "Sports",
  culture: "Culture",
  other: "Other",
}

const EVENT_TYPE_COLOR: Record<EventType, string> = {
  dinner: "bg-orange-100 text-orange-700",
  study: "bg-blue-100 text-blue-700",
  networking: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  culture: "bg-pink-100 text-pink-700",
  other: "bg-slate-100 text-slate-600",
}

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EventCard({ event, userId }: Props) {
  const supabase = createClient()
  const [participating, setParticipating] = useState(event.is_participating ?? false)
  const [count, setCount] = useState(event.participants_count)

  async function toggleParticipation() {
    const next = !participating
    setParticipating(next)
    setCount((c) => c + (next ? 1 : -1))

    if (next) {
      await supabase.from("event_participants").insert({ event_id: event.id, user_id: userId })
    } else {
      await supabase
        .from("event_participants")
        .delete()
        .eq("event_id", event.id)
        .eq("user_id", userId)
    }
  }

  const isFull =
    event.max_participants !== null && count >= event.max_participants && !participating

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                EVENT_TYPE_COLOR[event.event_type as EventType]
              }`}
            >
              {EVENT_TYPE_LABEL[event.event_type as EventType]}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 leading-snug">{event.title}</h3>
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
        {event.description && (
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">{event.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span>
            {count}人参加
            {event.max_participants ? ` / 最大${event.max_participants}人` : ""}
          </span>
          <span className="text-slate-300">·</span>
          <span>主催: @{event.organizer.username}</span>
        </div>

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
          {participating ? "参加済み（取消）" : isFull ? "満員" : "参加する"}
        </button>
      </div>
    </article>
  )
}
