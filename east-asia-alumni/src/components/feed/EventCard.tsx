"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { EventWithOrganizer, EventType, CommentWithAuthor } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"

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

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "今"
  if (mins < 60) return `${mins}分前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}日前`
  return new Date(iso).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
}

export function EventCard({ event, userId }: Props) {
  const supabase = createClient()
  const [participating, setParticipating] = useState(event.is_participating ?? false)
  const [count, setCount] = useState(event.participants_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
  const [commentInput, setCommentInput] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)

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

        <div className="flex items-center gap-2">
          <button
            onClick={toggleComments}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              showComments ? "text-indigo-500" : "text-slate-400 hover:text-indigo-400"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
          </button>

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
      </div>

      {/* コメントセクション */}
      {showComments && (
        <div className="flex flex-col gap-3 pt-1 border-t border-slate-100">
          {comments.length > 0 && (
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Link href={`/profile/${c.author_id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                    <Avatar name={c.author.full_name} avatarUrl={c.author.avatar_url} size="xs" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${c.author_id}`} className="hover:underline">
                      <span className="text-xs font-semibold text-slate-800">{c.author.full_name}</span>
                    </Link>
                    <span className="text-xs text-slate-400 ml-1.5">{formatDate(c.created_at)}</span>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="コメントを入力..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || commentSubmitting}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              送信
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
