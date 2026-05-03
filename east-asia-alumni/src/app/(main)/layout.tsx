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
  let avatarUrl: string | null = null
  let fullName = ""
  if (user) {
    const [{ count }, { data: profile }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
      supabase
        .from("profiles")
        .select("avatar_url, full_name")
        .eq("id", user.id)
        .single(),
    ])
    unreadCount = count ?? 0
    avatarUrl = profile?.avatar_url ?? null
    fullName = profile?.full_name ?? ""
  }

  return (
    <div className="flex h-full">
      <Sidebar unreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:py-6">
          {children}
        </div>
      </main>
      <BottomNav unreadCount={unreadCount} avatarUrl={avatarUrl} fullName={fullName} />
    </div>
  )
}
