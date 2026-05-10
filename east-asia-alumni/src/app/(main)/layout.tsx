import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let unreadCount = 0
  let unreadMessageCount = 0
  let avatarUrl: string | null = null
  let fullName = ""
  if (user) {
    const { data: myConvRows } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", user.id)
    const convIds = (myConvRows ?? []).map((r) => r.conversation_id)

    const [{ count }, { data: profile }, msgResult] = await Promise.all([
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
      supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).single(),
      convIds.length > 0
        ? supabase.from("messages").select("*", { count: "exact", head: true }).in("conversation_id", convIds).neq("sender_id", user.id).is("read_at", null)
        : Promise.resolve({ count: 0 }),
    ])
    const msgCount = (msgResult as { count: number | null }).count
    unreadCount = count ?? 0
    unreadMessageCount = msgCount ?? 0
    avatarUrl = profile?.avatar_url ?? null
    fullName = profile?.full_name ?? ""
  }

  return (
    <div className="flex h-full">
      <Sidebar unreadCount={unreadCount} unreadMessageCount={unreadMessageCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:py-6">
          {children}
        </div>
      </main>
      <BottomNav unreadCount={unreadCount} unreadMessageCount={unreadMessageCount} avatarUrl={avatarUrl} fullName={fullName} userId={user?.id} />
    </div>
  )
}
