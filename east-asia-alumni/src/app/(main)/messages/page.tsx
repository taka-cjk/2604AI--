import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Message } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { MessagesListRefresh } from "@/components/messages/MessagesListRefresh"
import { MarkAsUnreadButton } from "@/components/messages/MarkAsUnreadButton"

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: myParticipations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id)

  const convIds = (myParticipations ?? []).map((p) => p.conversation_id)

  if (convIds.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <MessagesListRefresh userId={user.id} />
        <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-4">No messages yet.</p>
          <Link href="/discover" className="text-sm text-indigo-600 hover:underline">
            Find people to connect with →
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: otherParticipants }, { data: allMessages }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, profile:profiles!conversation_participants_user_id_fkey(id, username, full_name, avatar_url)")
      .in("conversation_id", convIds)
      .neq("user_id", user.id),
    supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: true }),
  ])

  type OtherParticipant = { conversation_id: string; user_id: string; profile: Profile }

  const convItems = convIds
    .map((convId) => {
      const msgs = (allMessages ?? []).filter((m) => m.conversation_id === convId) as Message[]
      const lastMsg = msgs[msgs.length - 1] ?? null
      const unread = msgs.filter((m) => m.sender_id !== user.id && !m.read_at).length
      const lastReceivedMsg = [...msgs].reverse().find((m) => m.sender_id !== user.id) ?? null
      const other = (otherParticipants as unknown as OtherParticipant[] ?? []).find((p) => p.conversation_id === convId)
      return { convId, otherProfile: other?.profile ?? null, lastMsg, unread, lastReceivedMsg }
    })
    .filter((c) => c.otherProfile)
    .sort((a, b) => {
      const ta = a.lastMsg?.created_at ?? ""
      const tb = b.lastMsg?.created_at ?? ""
      return tb.localeCompare(ta)
    })

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  }

  return (
    <div className="flex flex-col gap-4">
      <MessagesListRefresh userId={user.id} />
      <h1 className="text-xl font-semibold text-slate-900">Messages</h1>

      {convItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm mb-4">No messages yet.</p>
          <Link href="/discover" className="text-sm text-indigo-600 hover:underline">
            Find people to connect with →
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100">
          {convItems.map(({ convId, otherProfile, lastMsg, unread, lastReceivedMsg }) => (
            <li key={convId} className="relative flex items-center">
              <Link
                href={`/messages/${otherProfile!.id}`}
                className="flex flex-1 items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors pr-8"
              >
                <Avatar name={otherProfile!.full_name} avatarUrl={otherProfile!.avatar_url} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${unread > 0 ? "font-bold text-slate-900" : "font-semibold text-slate-900"}`}>
                      {otherProfile!.full_name}
                    </p>
                    {lastMsg && (
                      <p className="text-xs text-slate-400 shrink-0">{formatTime(lastMsg.created_at)}</p>
                    )}
                  </div>
                  {lastMsg && (
                    <p className={`text-xs truncate mt-0.5 ${unread > 0 ? "text-slate-800 font-medium" : "text-slate-400"}`}>
                      {lastMsg.sender_id === user.id ? "You: " : ""}{lastMsg.content}
                    </p>
                  )}
                </div>
                {unread > 0 && (
                  <span className="shrink-0 h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              {unread === 0 && lastReceivedMsg && (
                <MarkAsUnreadButton
                  msgId={lastReceivedMsg.id}
                  className="absolute right-0 top-1/2 -translate-y-1/2"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
