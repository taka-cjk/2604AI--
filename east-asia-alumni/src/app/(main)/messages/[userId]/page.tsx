import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, Message } from "@/types/index"
import { ChatWindow } from "@/components/messages/ChatWindow"

type Props = { params: Promise<{ userId: string }> }

export default async function ChatPage({ params }: Props) {
  const { userId: targetUserId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  if (targetUserId === user.id) redirect("/profile/me")

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetUserId)
    .single<Profile>()

  if (!targetProfile) notFound()

  // 既存の会話を検索（自分と相手の共通 conversation_id）
  const [{ data: myConvs }, { data: theirConvs }] = await Promise.all([
    supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id),
    supabase.from("conversation_participants").select("conversation_id").eq("user_id", targetUserId),
  ])

  const myIds = new Set((myConvs ?? []).map((r) => r.conversation_id))
  const sharedConvId = (theirConvs ?? []).find((r) => myIds.has(r.conversation_id))?.conversation_id ?? null

  let initialMessages: Message[] = []
  if (sharedConvId) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", sharedConvId)
      .order("created_at", { ascending: true })
    initialMessages = (msgs ?? []) as Message[]

    // 自分宛ての未読を既読に
    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", sharedConvId)
      .neq("sender_id", user.id)
      .is("read_at", null)
  }

  return (
    <ChatWindow
      initialMessages={initialMessages}
      conversationId={sharedConvId}
      currentUserId={user.id}
      targetUserId={targetUserId}
      targetProfile={targetProfile}
    />
  )
}
