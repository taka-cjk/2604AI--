"use client"

import { useState, useMemo, useEffect } from "react"
import type { PostWithAuthor, EventWithOrganizer, ArticleWithAuthors } from "@/types/index"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "./PostCard"
import { CreatePostForm } from "./CreatePostForm"
import { EventCard } from "./EventCard"
import { CreateEventForm } from "./CreateEventForm"
import { EventCalendar } from "@/components/events/EventCalendar"
import { ArticleCard } from "./ArticleCard"
import { ArticleList } from "./ArticleList"
import { CreateArticleForm } from "./CreateArticleForm"

type Tab = "feed" | "articles" | "events"

type Props = {
  initialPosts: PostWithAuthor[]
  initialEvents: EventWithOrganizer[]
  initialArticles: ArticleWithAuthors[]
  userId: string
}

export function FeedClient({ initialPosts, initialEvents, initialArticles, userId }: Props) {
  const [tab, setTab] = useState<Tab>("feed")
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts)
  const [events, setEvents] = useState<EventWithOrganizer[]>(initialEvents)
  const [articles, setArticles] = useState<ArticleWithAuthors[]>(initialArticles)
  const [hasNewEvent, setHasNewEvent] = useState(false)
  const [showArticleForm, setShowArticleForm] = useState(false)

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

  // Feed タブ: 投稿・記事・イベントを created_at の降順で混在表示
  const mixedFeed = useMemo(() => {
    type FeedItem =
      | { kind: "post"; data: PostWithAuthor; date: string }
      | { kind: "article"; data: ArticleWithAuthors; date: string }
      | { kind: "event"; data: EventWithOrganizer; date: string }

    const items: FeedItem[] = [
      ...posts.map((p) => ({ kind: "post" as const, data: p, date: p.created_at })),
      ...articles
        .filter((a) => a.status === "published")
        .map((a) => ({ kind: "article" as const, data: a, date: a.created_at })),
      ...events.filter((e) => !e.deleted_at).map((e) => ({ kind: "event" as const, data: e, date: e.created_at })),
    ]
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [posts, articles, events])

  function handleEventAdd(event: EventWithOrganizer) {
    setEvents((prev) => [event, ...prev])
  }

  function handleEventUpdate(updated: EventWithOrganizer) {
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  function handleEventDelete(eventId: string) {
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, deleted_at: new Date().toISOString() } : e))
  }

  function handleArticleAdd(article: ArticleWithAuthors) {
    setArticles((prev) => [article, ...prev])
  }

  // Articles タブ：自分のdraftは表示、他人のdraftは非表示
  const visibleArticles = useMemo(() =>
    articles.filter((a) => a.status === "published" || a.author_id === userId),
    [articles, userId]
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {(["feed", "articles", "events"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "events") setHasNewEvent(false) }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "feed" ? "Feed" : t === "articles" ? "Articles" : (
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
            mixedFeed.map((item) => {
              if (item.kind === "post") return (
                <PostCard key={`post-${item.data.id}`} post={item.data} userId={userId} />
              )
              if (item.kind === "article") return (
                <ArticleCard key={`article-${item.data.id}`} article={item.data} />
              )
              return (
                <EventCard
                  key={`event-${item.data.id}`}
                  event={item.data}
                  userId={userId}
                  onUpdate={handleEventUpdate}
                  onDelete={handleEventDelete}
                />
              )
            })
          )}
        </div>
      )}

      {/* Articles タブ */}
      {tab === "articles" && (
        <div className="flex flex-col gap-4">
          {showArticleForm ? (
            <CreateArticleForm
              userId={userId}
              onAdd={handleArticleAdd}
              onClose={() => setShowArticleForm(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowArticleForm(true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors text-left flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Write an Article
            </button>
          )}
          <ArticleList articles={visibleArticles} />
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
            onDelete={handleEventDelete}
          />
        </div>
      )}
    </div>
  )
}
