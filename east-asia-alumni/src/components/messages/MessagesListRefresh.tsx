"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function MessagesListRefresh({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("messages-list-refresh")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const notif = payload.new as { type?: string }
        if (notif.type === "message") router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, router])

  return null
}
