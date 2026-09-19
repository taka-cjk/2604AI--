import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { redirect } from "next/navigation"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name, onboarding_completed_at")
    .eq("id", user.id)
    .single()

  if (!profile?.onboarding_completed_at) redirect("/auth/onboarding")

  let unreadCount = 0
  let unreadMessageCount = 0
  const { data: myConvRows } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)
  const convIds = (myConvRows ?? []).map((r) => r.conversation_id)

  const [{ count }, msgResult] = await Promise.all([
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
    convIds.length > 0
      ? supabase.from("messages").select("*", { count: "exact", head: true }).in("conversation_id", convIds).neq("sender_id", user.id).is("read_at", null)
      : Promise.resolve({ count: 0 }),
  ])
  const msgCount = (msgResult as { count: number | null }).count
  unreadCount = count ?? 0
  unreadMessageCount = msgCount ?? 0

  return (
    <div className="flex h-full">
      <Sidebar unreadCount={unreadCount} unreadMessageCount={unreadMessageCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:py-6">
          {children}
        </div>
      </main>
      <BottomNav unreadCount={unreadCount} unreadMessageCount={unreadMessageCount} avatarUrl={profile.avatar_url} fullName={profile.full_name} userId={user.id} />
    </div>
  )
}
