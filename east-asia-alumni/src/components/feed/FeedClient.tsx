"use client"

import { useState, useMemo, useEffect } from "react"
import type { PostWithAuthor, EventWithOrganizer } from "@/types/index"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "./PostCard"
import { CreatePostForm } from "./CreatePostForm"
import { EventCard } from "./EventCard"
import { CreateEventForm } from "./CreateEventForm"
import { EventCalendar } from "@/components/events/EventCalendar"

type Tab = "feed" | "events"

type Props = {
  initialPosts: PostWithAuthor[]
  initialEvents: EventWithOrganizer[]
  userId: string
}

export function FeedClient({ initialPosts, initialEvents, userId }: Props) {
  const [tab, setTab] = useState<Tab>("feed")
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts)
  const [events, setEvents] = useState<EventWithOrganizer[]>(initialEvents)
  const [hasNewEvent, setHasNewEvent] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("feed-event-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "events" }, () => {
        setHasNewEvent((prev) => !prev ? true : prev)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Feed タブ: 投稿とイベントを created_at の降順で混在表示
  const mixedFeed = useMemo(() => {
    type FeedItem =
      | { kind: "post"; data: PostWithAuthor; date: string }
      | { kind: "event"; data: EventWithOrganizer; date: string }

    const items: FeedItem[] = [
      ...posts.map((p) => ({ kind: "post" as const, data: p, date: p.created_at })),
      ...events.map((e) => ({ kind: "event" as const, data: e, date: e.created_at })),
    ]
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [posts, events])

  function handleEventAdd(event: EventWithOrganizer) {
    setEvents((prev) => [event, ...prev])
  }

  function handleEventUpdate(updated: EventWithOrganizer) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["feed", "events"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "events") setHasNewEvent(false) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "feed" ? "Feed" : (
              <span className="relative">
                Events
                {hasNewEvent && (
                  <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-red-500" />
                )}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed タブ：投稿フォーム ＋ 混在タイムライン */}
      {tab === "feed" && (
        <div className="flex flex-col gap-4">
          <CreatePostForm
            userId={userId}
            onAdd={(post) => setPosts((prev) => [post, ...prev])}
          />
          {mixedFeed.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No posts yet. Be the first to share!
            </p>
          ) : (
            mixedFeed.map((item) =>
              item.kind === "post" ? (
                <PostCard key={`post-${item.data.id}`} post={item.data} userId={userId} />
              ) : (
                <EventCard
                  key={`event-${item.data.id}`}
                  event={item.data}
                  userId={userId}
                  onUpdate={handleEventUpdate}
                />
              )
            )
          )}
        </div>
      )}

      {/* Events タブ：イベント作成フォーム ＋ カレンダー/リスト表示 */}
      {tab === "events" && (
        <div className="flex flex-col gap-4">
          <CreateEventForm userId={userId} onAdd={handleEventAdd} />
          <EventCalendar
            events={events}
            userId={userId}
            onUpdate={handleEventUpdate}
          />
        </div>
      )}
    </div>
  )
}
