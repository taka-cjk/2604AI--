"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Message, Profile } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import Link from "next/link"

type Props = {
  initialMessages: Message[]
  conversationId: string | null
  currentUserId: string
  targetUserId: string
  targetProfile: Profile
}

export function ChatWindow({ initialMessages, conversationId: initConvId, currentUserId, targetUserId, targetProfile }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [conversationId, setConversationId] = useState<string | null>(initConvId)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput("")

    // msgIdをクライアントで生成 → optimistic messageと同じIDでINSERT → dedup自動
    const msgId = crypto.randomUUID()
    setMessages((prev) => [...prev, {
      id: msgId,
      conversation_id: conversationId ?? "",
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
    }])

    let convId = conversationId
    if (!convId) {
      convId = crypto.randomUUID()
      const { error: convErr } = await supabase.from("conversations").insert({ id: convId })
      if (convErr) {
        console.error("[DM] conversations insert error:", convErr)
        setMessages((prev) => prev.filter((m) => m.id !== msgId))
        setSending(false)
        return
      }
      const { error: part1Err } = await supabase.from("conversation_participants").insert(
        { conversation_id: convId, user_id: currentUserId }
      )
      if (part1Err) {
        console.error("[DM] self participant error:", part1Err)
        setMessages((prev) => prev.filter((m) => m.id !== msgId))
        setSending(false)
        return
      }
      const { error: part2Err } = await supabase.from("conversation_participants").insert(
        { conversation_id: convId, user_id: targetUserId }
      )
      if (part2Err) {
        console.error("[DM] target participant error:", part2Err)
        setMessages((prev) => prev.filter((m) => m.id !== msgId))
        setSending(false)
        return
      }
      setConversationId(convId)
      setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, conversation_id: convId! } : m))
    }

    const { error: msgErr } = await supabase
      .from("messages")
      .insert({ id: msgId, conversation_id: convId, sender_id: currentUserId, content: text })

    if (msgErr) {
      console.error("[DM] messages insert error:", msgErr)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
    } else {
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        actor_id: currentUserId,
        type: "message" as const,
        entity_id: convId,
      })
    }

    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100 shrink-0">
        <Link href={`/profile/${targetProfile.id}`}>
          <Avatar name={targetProfile.full_name} avatarUrl={targetProfile.avatar_url} size="sm" />
        </Link>
        <div>
          <Link href={`/profile/${targetProfile.id}`} className="text-sm font-semibold text-slate-900 hover:underline">
            {targetProfile.full_name}
          </Link>
          <p className="text-xs text-slate-400">@{targetProfile.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Say hi to {targetProfile.full_name.split(" ")[0]}!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                isMine
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-slate-100 text-slate-900 rounded-bl-sm"
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${isMine ? "text-indigo-200" : "text-slate-400"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end shrink-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          style={{ maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  )
}
