"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function MarkAsUnreadButton({ msgId, className }: { msgId: string; className?: string }) {
  const router = useRouter()

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from("messages").update({ read_at: null }).eq("id", msgId)
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      title="Mark as unread"
      className={`h-7 w-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition-colors ${className ?? ""}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.981l7.5-4.039a2.25 2.25 0 012.134 0l7.5 4.039a2.25 2.25 0 011.183 1.98V19.5z" />
      </svg>
    </button>
  )
}
