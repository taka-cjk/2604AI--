"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
    case "event_update": return `参加中のイベントの詳細が変更されました`
    case "mention": return `${name} がコメントであなたをメンションしました`
    case "message": return `${name} からメッセージが届きました`
  }
}

const GROUP_CONFIG: Record<NotificationType, { label: string; iconBg: string; iconColor: string }> = {
  follow: { label: "新しいフォロワー", iconBg: "bg-indigo-50", iconColor: "text-indigo-500" },
  like: { label: "いいね", iconBg: "bg-red-50", iconColor: "text-red-500" },
  comment: { label: "コメント", iconBg: "bg-blue-50", iconColor: "text-blue-500" },
  event_join: { label: "イベント参加", iconBg: "bg-teal-50", iconColor: "text-teal-500" },
  event_update: { label: "イベント変更", iconBg: "bg-amber-50", iconColor: "text-amber-500" },
  mention: { label: "メンション", iconBg: "bg-sky-50", iconColor: "text-sky-500" },
  message: { label: "メッセージ", iconBg: "bg-violet-50", iconColor: "text-violet-500" },
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
  if (type === "event_join") return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  )
}

function FollowBackButton({ actorId, userId }: { actorId: string; userId: string }) {
  const supabase = createClient()
  const [followed, setFollowed] = useState(false)

  async function handleFollowBack() {
    if (followed) return
    setFollowed(true)
    await supabase.from("follows").insert({ follower_id: userId, following_id: actorId })
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
      {followed ? "フォロー中" : "フォローバック"}
    </button>
  )
}

export function NotificationList({ notifications, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
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

  // タイプ別グループ化
  const groupMap: Partial<Record<NotificationType, NotificationWithActor[]>> = {}
  for (const item of items) {
    if (!groupMap[item.type]) groupMap[item.type] = []
    groupMap[item.type]!.push(item)
  }

  // 最新通知が含まれるグループを上に
  const sortedGroups = (Object.entries(groupMap) as [NotificationType, NotificationWithActor[]][])
    .sort(([, a], [, b]) =>
      new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime()
    )

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
          <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
            すべて既読にする
          </button>
        )}
      </div>

      {/* グループ一覧 */}
      {sortedGroups.map(([type, groupItems]) => {
        const config = GROUP_CONFIG[type]
        const groupUnread = groupItems.filter((n) => !n.read).length
        return (
          <div key={type} className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-3">
            {/* グループヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className={`rounded-lg p-1.5 ${config.iconBg}`}>
                  <TypeIcon type={type} className={`h-4 w-4 ${config.iconColor}`} />
                </div>
                <span className="text-sm font-semibold text-slate-800">{config.label}</span>
                {groupUnread > 0 && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {groupUnread}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">{formatDate(groupItems[0].created_at)}</span>
            </div>

            {/* 通知行 */}
            {groupItems.map((n) => (
              <div
                key={n.id}
                onClick={() => n.actor_id && router.push(`/profile/${n.actor_id}`)}
                className={`flex items-center gap-3 px-4 py-3 border-t border-slate-100 first:border-t-0 ${
                  !n.read ? "bg-blue-50/30" : ""
                } ${n.actor_id ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""}`}
              >
                {n.actor ? (
                  <Avatar name={n.actor.full_name} avatarUrl={n.actor.avatar_url} size="sm" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <TypeIcon type={n.type} className={`h-4 w-4 ${config.iconColor}`} />
                  </div>
                )}
                <p className="flex-1 text-sm text-slate-700 min-w-0">{getNotificationText(n)}</p>
                {/* follow のみフォローバックボタン（クリック伝播を止める）、それ以外は時間 */}
                {n.type === "follow" && n.actor_id ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <FollowBackButton actorId={n.actor_id} userId={userId} />
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 shrink-0">{formatDate(n.created_at)}</span>
                )}
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
