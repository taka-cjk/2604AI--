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
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
    unreadCount = count ?? 0
  }

  return (
    <div className="flex h-full">
      <Sidebar unreadCount={unreadCount} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 md:py-6">
          {children}
        </div>
      </main>
      <BottomNav unreadCount={unreadCount} />
    </div>
  )
}
