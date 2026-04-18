"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { NotificationWithActor, NotificationType } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"

type Props = {
  notifications: NotificationWithActor[]
  userId: string
}

function formatDate(iso: string): string {
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

function getNotificationText(n: NotificationWithActor): string {
  const name = n.actor?.full_name ?? "誰か"
  switch (n.type) {
    case "follow": return `${name} があなたをフォローしました`
    case "like": return `${name} があなたの投稿にいいねしました`
    case "comment": return `${name} があなたの投稿にコメントしました`
    case "event_join": return `${name} があなたのイベントに参加しました`
    case "message": return `${name} からメッセージが届きました`
  }
}

const TYPE_ICON_CONFIG: Record<NotificationType, { bg: string; color: string }> = {
  follow: { bg: "bg-indigo-500", color: "text-white" },
  like: { bg: "bg-red-500", color: "text-white" },
  comment: { bg: "bg-blue-500", color: "text-white" },
  event_join: { bg: "bg-teal-500", color: "text-white" },
  message: { bg: "bg-violet-500", color: "text-white" },
}

function SmallTypeIcon({ type }: { type: NotificationType }) {
  const config = TYPE_ICON_CONFIG[type]
  return (
    <span className={`absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full ${config.bg} ring-1 ring-white`}>
      {type === "follow" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-white">
          <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.046 15.253c-.058.468.172.92.57 1.174A9.953 9.953 0 008 18c1.536 0 2.986-.354 4.272-.982l-.021-.016A5.976 5.976 0 0110 12H4a4 4 0 00-1.954 3.253zM16.5 10a.75.75 0 00-.75.75v1.5h-1.5a.75.75 0 000 1.5h1.5v1.5a.75.75 0 001.5 0v-1.5h1.5a.75.75 0 000-1.5h-1.5v-1.5A.75.75 0 0016.5 10z" />
        </svg>
      )}
      {type === "like" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-white">
          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.184C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.536a22.049 22.049 0 01-3.744 2.754l-.018.01-.006.003-.001.001a.752.752 0 01-.704 0l-.001-.001z" />
        </svg>
      )}
      {type === "comment" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-white">
          <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
        </svg>
      )}
      {type === "event_join" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-white">
          <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
        </svg>
      )}
      {type === "message" && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 text-white">
          <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
          <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
        </svg>
      )}
    </span>
  )
}

export function NotificationListA({ notifications, userId }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState(notifications)

  const unreadCount = items.filter((n) => !n.read).length

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12 mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <p className="text-sm font-medium">通知はありません</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        {unreadCount > 0 ? (
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-indigo-600">{unreadCount}件</span> の未読通知
          </span>
        ) : (
          <span className="text-sm text-slate-400">すべて既読です</span>
        )}
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-indigo-600 hover:underline"
          >
            すべて既読にする
          </button>
        )}
      </div>

      {/* リスト */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {items.map((n, i) => (
          <div
            key={n.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              i > 0 ? "border-t border-slate-100" : ""
            } ${!n.read ? "bg-indigo-50/40" : ""}`}
          >
            {/* アバター + タイプアイコン */}
            <div className="relative shrink-0">
              {n.actor ? (
                <Avatar name={n.actor.full_name} avatarUrl={n.actor.avatar_url} size="sm" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
              )}
              <SmallTypeIcon type={n.type} />
            </div>

            {/* テキスト */}
            <p className="flex-1 text-sm text-slate-700 min-w-0">
              {getNotificationText(n)}
            </p>

            {/* 時間 */}
            <span className="text-xs text-slate-400 shrink-0">{formatDate(n.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
