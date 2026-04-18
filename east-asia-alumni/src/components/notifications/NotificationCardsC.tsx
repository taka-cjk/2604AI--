"use client"

import { useState } from "react"
import Link from "next/link"
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

const TYPE_BADGE: Record<NotificationType, { label: string; className: string }> = {
  follow: { label: "フォロー", className: "bg-indigo-100 text-indigo-700" },
  like: { label: "いいね", className: "bg-red-100 text-red-700" },
  comment: { label: "コメント", className: "bg-blue-100 text-blue-700" },
  event_join: { label: "イベント参加", className: "bg-teal-100 text-teal-700" },
  message: { label: "メッセージ", className: "bg-violet-100 text-violet-700" },
}

function NotificationCard({
  notification,
  userId,
  onRead,
}: {
  notification: NotificationWithActor
  userId: string
  onRead: (id: string) => void
}) {
  const supabase = createClient()
  const [followed, setFollowed] = useState(false)
  const badge = TYPE_BADGE[notification.type]

  async function handleFollowBack() {
    if (!notification.actor_id || followed) return
    setFollowed(true)
    await supabase.from("follows").insert({ follower_id: userId, following_id: notification.actor_id })
  }

  async function handleMarkRead() {
    if (notification.read) return
    onRead(notification.id)
    await supabase.from("notifications").update({ read: true }).eq("id", notification.id)
  }

  return (
    <div
      onClick={handleMarkRead}
      className={`rounded-xl border bg-white px-5 py-4 flex flex-col gap-3 cursor-pointer transition-colors ${
        !notification.read
          ? "border-l-4 border-l-indigo-400 border-indigo-200 bg-indigo-50/20"
          : "border-slate-200 hover:bg-slate-50"
      }`}
    >
      {/* 上段: バッジ + 時間 + 未読ドット */}
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
          {badge.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{formatDate(notification.created_at)}</span>
          {!notification.read && (
            <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
          )}
        </div>
      </div>

      {/* 中段: Avatar + テキスト */}
      <div className="flex items-start gap-3">
        {notification.actor ? (
          <Avatar name={notification.actor.full_name} avatarUrl={notification.actor.avatar_url} size="md" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800">
            <span className="font-semibold">{notification.actor?.full_name ?? "誰か"}</span>
            {" "}
            {notification.type === "follow" && "があなたをフォローしました"}
            {notification.type === "like" && "があなたの投稿にいいねしました"}
            {notification.type === "comment" && "があなたの投稿にコメントしました"}
            {notification.type === "event_join" && "があなたのイベントに参加しました"}
            {notification.type === "message" && "からメッセージが届きました"}
          </p>
          {notification.actor && (
            <p className="text-xs text-slate-400 mt-0.5">
              @{notification.actor.username}
              {notification.actor.home_country ? ` · ${notification.actor.home_country}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* 下段: アクションボタン（タイプ別） */}
      {notification.type === "follow" && notification.actor_id && (
        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleFollowBack() }}
            disabled={followed}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              followed
                ? "bg-slate-100 text-slate-500 cursor-default"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {followed ? "フォロー中" : "フォローバック"}
          </button>
        </div>
      )}
      {notification.type === "message" && (
        <div>
          <Link
            href="/messages"
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            返信する
          </Link>
        </div>
      )}
    </div>
  )
}

export function NotificationCardsC({ notifications, userId }: Props) {
  const supabase = createClient()
  const [items, setItems] = useState(notifications)

  const unreadCount = items.filter((n) => !n.read).length

  function handleRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

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
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-14 w-14 mb-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        <p className="text-sm font-medium">通知はまだありません</p>
        <p className="text-xs mt-1">フォローされたり、いいねされたら通知が届きます</p>
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
          <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
            すべて既読にする
          </button>
        )}
      </div>

      {/* カード一覧 */}
      <div className="flex flex-col gap-3">
        {items.map((n) => (
          <NotificationCard
            key={n.id}
            notification={n}
            userId={userId}
            onRead={handleRead}
          />
        ))}
      </div>
    </div>
  )
}
