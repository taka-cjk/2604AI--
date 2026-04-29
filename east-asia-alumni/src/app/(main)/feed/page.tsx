import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FeedClient } from "@/components/feed/FeedClient"
import type { PostWithAuthor, EventWithOrganizer, Profile } from "@/types/index"

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // ── Posts ──────────────────────────────────────────────
  const { data: postsRaw } = await supabase
    .from("posts")
    .select("*, author:profiles!posts_author_id_fkey(*)")
    .order("created_at", { ascending: false })
    .limit(30)

  const postIds = (postsRaw ?? []).map((p) => p.id)

  const [{ data: likesData }, { data: commentsData }] = await Promise.all([
    postIds.length
      ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    postIds.length
      ? supabase.from("comments").select("post_id").in("post_id", postIds)
      : Promise.resolve({ data: [] }),
  ])

  const posts: PostWithAuthor[] = (postsRaw ?? []).map((p) => ({
    id: p.id,
    author_id: p.author_id,
    content: p.content,
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: p.author as Profile,
    likes_count: (likesData ?? []).filter((l) => l.post_id === p.id).length,
    comments_count: (commentsData ?? []).filter((c) => c.post_id === p.id).length,
    is_liked: (likesData ?? []).some((l) => l.post_id === p.id && l.user_id === user.id),
  }))

  // ── Events ─────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)

  const { data: eventsRaw } = await supabase
    .from("events")
    .select("*, organizer:profiles!events_organizer_id_fkey(*)")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(20)

  const eventIds = (eventsRaw ?? []).map((e) => e.id)

  const [{ data: participantsData }, { data: cohostsData }] = await Promise.all([
    eventIds.length
      ? supabase.from("event_participants").select("event_id, user_id").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length
      ? supabase.from("event_cohosts").select("event_id, profile:profiles!event_cohosts_user_id_fkey(*)").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
  ])

  const events = ((eventsRaw ?? []).map((e) => ({
    id: e.id,
    organizer_id: e.organizer_id,
    title: e.title,
    description: e.description,
    event_type: e.event_type,
    location: e.location,
    event_date: e.event_date,
    max_participants: e.max_participants,
    price_students: e.price_students ?? null,
    price_other: e.price_other ?? null,
    registration_link: e.registration_link ?? null,
    created_at: e.created_at,
    updated_at: e.updated_at,
    organizer: e.organizer as Profile,
    participants_count: (participantsData ?? []).filter((p) => p.event_id === e.id).length,
    is_participating: (participantsData ?? []).some(
      (p) => p.event_id === e.id && p.user_id === user.id
    ),
    cohosts: (cohostsData ?? [])
      .filter((c) => c.event_id === e.id)
      .map((c) => c.profile as Profile),
  }))) as EventWithOrganizer[]

  return <FeedClient initialPosts={posts} initialEvents={events} userId={user.id} />
}
