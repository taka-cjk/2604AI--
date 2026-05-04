import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { NotificationWithActor, Profile } from "@/types/index"
import { NotificationList } from "@/components/notifications/NotificationList"

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: notificationsRaw } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const actorIds = [...new Set(
    (notificationsRaw ?? []).map((n: any) => n.actor_id).filter(Boolean)
  )] as string[]

  const { data: actors } = actorIds.length > 0
    ? await supabase.from("profiles").select("*").in("id", actorIds)
    : { data: [] }

  const actorMap = Object.fromEntries((actors ?? []).map((a: any) => [a.id, a as Profile]))
  const notifications: NotificationWithActor[] = (notificationsRaw ?? []).map((n: any) => ({
    ...n,
    actor: n.actor_id ? actorMap[n.actor_id] : undefined,
  }))

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
      <NotificationList notifications={notifications} userId={user.id} />
    </div>
  )
}
