import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EventCalendar } from "@/components/events/EventCalendar"
import type { EventWithOrganizer, Profile } from "@/types/index"

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const today = new Date().toISOString().slice(0, 10)
  const sixMonthsLater = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const { data: eventsRaw } = await supabase
    .from("events")
    .select("*, organizer:profiles!events_organizer_id_fkey(*)")
    .gte("event_date", today)
    .lte("event_date", sixMonthsLater)
    .order("event_date", { ascending: true })

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

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Events</h1>
      <EventCalendar events={events} userId={user.id} />
    </div>
  )
}
