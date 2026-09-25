"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  targetId: string
  currentUserId: string
  initialFollowing: boolean
}

export function FollowButton({ targetId, currentUserId, initialFollowing }: Props) {
  const supabase = createClient()
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    const next = !following
    setFollowing(next)
    if (next) {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetId })
    } else {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetId)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
        following
          ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  )
}
