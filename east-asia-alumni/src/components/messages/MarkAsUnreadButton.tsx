"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type Props = {
  conversationId: string
  lastReceivedMsgId: string | null
  isUnread: boolean
  currentUserId: string
  className?: string
}

export function MarkAsUnreadButton({ conversationId, lastReceivedMsgId, isUnread, currentUserId, className }: Props) {
  const router = useRouter()

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    if (isUnread) {
      // 未読 → 既読：この会話の相手からの未読メッセージを全て既読に
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", currentUserId)
        .is("read_at", null)
    } else {
      // 既読 → 未読：最後に受け取ったメッセージを未読に戻す
      if (!lastReceivedMsgId) return
      await supabase.from("messages").update({ read_at: null }).eq("id", lastReceivedMsgId)
    }
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      title={isUnread ? "Mark as read" : "Mark as unread"}
      className={`h-7 w-7 flex items-center justify-center rounded-full transition-colors ${
        isUnread
          ? "text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
          : "text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
      } ${className ?? ""}`}
    >
      {isUnread ? (
        // 既読にする：チェックマーク付きエンベロープ
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
          <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
          <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
        </svg>
      ) : (
        // 未読にする：エンベロープアウトライン
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
        </svg>
      )}
    </button>
  )
}
