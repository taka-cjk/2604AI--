"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { NotificationWithActor, NotificationType } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { LocalTime } from "@/components/ui/LocalTime"

type Props = {
  notifications: NotificationWithActor[]
  userId: string
  eventTitles?: Record<string, string>
}

function getRoute(n: NotificationWithActor): string | null {
  switch (n.type) {
    case "message":      return n.actor_id ? `/messages/${n.actor_id}` : null
    case "comment":
    case "mention":
    case "thread_reply": return "/feed"
    case "event_join":
    case "event_update":
    case "event_new":    return "/events"
    case "follow":       return n.actor_id ? `/profile/${n.actor_id}` : null
    case "like":
    default:             return null
  }
}

function getNotificationText(n: NotificationWithActor): string {
  const name = n.actor?.full_name ?? "Someone"
  switch (n.type) {
    case "follow": return `${name} followed you`
    case "like": return `${name} liked your post`
    case "comment": return `${name} commented on your post`
    case "event_join": return `${name} joined your event`
    case "event_update": return `An event you joined has been updated`
    case "mention": return `${name} mentioned you`
    case "message": return `New message from ${name}`
    case "thread_reply": return `${name} replied to a thread you're in`
    case "event_new": return `${name} added a new event`
  }
}

const TYPE_CONFIG: Record<NotificationType, { iconBg: string; iconColor: string; borderColor: string }> = {
  follow:       { iconBg: "bg-indigo-50",  iconColor: "text-indigo-500",  borderColor: "border-l-indigo-400" },
  like:         { iconBg: "bg-red-50",     iconColor: "text-red-500",     borderColor: "border-l-red-400" },
  comment:      { iconBg: "bg-blue-50",    iconColor: "text-blue-500",    borderColor: "border-l-blue-400" },
  event_join:   { iconBg: "bg-teal-50",    iconColor: "text-teal-500",    borderColor: "border-l-teal-400" },
  event_update: { iconBg: "bg-amber-50",   iconColor: "text-amber-500",   borderColor: "border-l-amber-400" },
  mention:      { iconBg: "bg-sky-50",     iconColor: "text-sky-500",     borderColor: "border-l-sky-400" },
  message:      { iconBg: "bg-violet-50",  iconColor: "text-violet-500",  borderColor: "border-l-violet-400" },
  thread_reply: { iconBg: "bg-emerald-50", iconColor: "text-emerald-500", borderColor: "border-l-emerald-400" },
  event_new:    { iconBg: "bg-green-50",   iconColor: "text-green-500",   borderColor: "border-l-green-400" },
}

function TypeIcon({ type, className }: { type: NotificationType; className?: string }) {
  if (type === "follow") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
  if (type === "like") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
  if (type === "comment") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  )
  if (type === "event_join" || type === "event_update" || type === "event_new") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
  if (type === "mention") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
    </svg>
  )
  if (type === "message") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
  )
}

function FollowBackButton({ actorId, userId, onDone }: { actorId: string; userId: string; onDone: () => void }) {
  const supabase = createClient()
  const [followed, setFollowed] = useState(false)

  async function handleFollowBack() {
    if (followed) return
    setFollowed(true)
    await supabase.from("follows").insert({ follower_id: userId, following_id: actorId })
    onDone()
  }

  return (
    <button
      onClick={handleFollowBack}
      disabled={followed}
      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        followed
          ? "bg-slate-100 text-slate-500 cursor-default"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {followed ? "Following" : "Follow back"}
    </button>
  )
}

function NotifCard({
  n,
  eventTitles,
  userId,
  onDismiss,
  onNavigate,
  muted,
}: {
  n: NotificationWithActor
  eventTitles: Record<string, string>
  userId: string
  onDismiss?: (id: string) => void
  onNavigate?: (n: NotificationWithActor) => void
  muted?: boolean
}) {
  const config = TYPE_CONFIG[n.type]
  const route = getRoute(n)
  const clickable = !!route

  return (
    <li
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 border-l-4 ${config.borderColor} ${
        muted ? "bg-slate-50" : "bg-white bg-indigo-50/20"
      } ${clickable ? "cursor-pointer hover:bg-slate-100 transition-colors" : ""}`}
      onClick={() => {
        if (!clickable || !onNavigate) return
        if (!muted && onDismiss) onDismiss(n.id)
        onNavigate(n)
      }}
    >
      {n.actor ? (
        <div className="relative shrink-0">
          <Avatar name={n.actor.full_name} avatarUrl={n.actor.avatar_url} size="sm" />
          <span className={`absolute -bottom-0.5 -right-0.5 rounded-full p-0.5 ${config.iconBg}`}>
            <TypeIcon type={n.type} className={`h-2.5 w-2.5 ${config.iconColor}`} />
          </span>
        </div>
      ) : (
        <div className={`shrink-0 rounded-full p-2 ${config.iconBg}`}>
          <TypeIcon type={n.type} className={`h-4 w-4 ${config.iconColor}`} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!muted ? "font-medium text-slate-900" : "text-slate-500"}`}>
          {getNotificationText(n)}
        </p>
        {n.type === "event_new" && n.entity_id && eventTitles[n.entity_id] && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">"{eventTitles[n.entity_id]}"</p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          <LocalTime iso={n.created_at} />
        </p>
      </div>

      {!muted && n.type === "event_new" ? (
        <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { onDismiss?.(n.id) }}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Check
          </button>
        </div>
      ) : !muted && n.type === "follow" && n.actor_id ? (
        <div onClick={(e) => e.stopPropagation()}>
          <FollowBackButton actorId={n.actor_id} userId={userId} onDone={() => onDismiss?.(n.id)} />
        </div>
      ) : !muted ? (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss?.(n.id) }}
          className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
          title="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </li>
  )
}

export function NotificationList({ notifications, userId, eventTitles = {} }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState(notifications)

  const unread = items.filter((n) => !n.read)
  const past   = items.filter((n) =>  n.read)

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    router.refresh()
  }

  async function dismiss(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id)
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  function navigate(n: NotificationWithActor) {
    const route = getRoute(n)
    if (route) router.push(route)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <p className="text-sm font-medium">No notifications</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        {unread.length > 0 ? (
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-indigo-600">{unread.length}</span> unread
          </span>
        ) : (
          <span className="text-sm text-slate-400">No NEW notifications</span>
        )}
        {unread.length > 0 && (
          <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {/* 未読リスト */}
      {unread.length > 0 && (
        <ul className="flex flex-col gap-2 mb-4">
          {unread.map((n) => (
            <NotifCard
              key={n.id}
              n={n}
              eventTitles={eventTitles}
              userId={userId}
              onDismiss={dismiss}
              onNavigate={navigate}
            />
          ))}
        </ul>
      )}

      {/* Past（既読）リスト */}
      {past.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Past</p>
          <ul className="flex flex-col gap-2">
            {past.map((n) => (
              <NotifCard
                key={n.id}
                n={n}
                eventTitles={eventTitles}
                userId={userId}
                onNavigate={navigate}
                muted
              />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
