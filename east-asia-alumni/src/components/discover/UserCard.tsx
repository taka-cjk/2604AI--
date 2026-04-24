"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { ProfileWithFollow } from "@/app/(main)/discover/page"
import { Avatar } from "@/components/ui/Avatar"
import { WANTS_MAP } from "@/data/wants"

type Props = {
  profile: ProfileWithFollow
  userId: string
}

export function UserCard({ profile, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [following, setFollowing] = useState(profile.is_following)

  async function toggleFollow(e: React.MouseEvent) {
    e.stopPropagation()
    const next = !following
    setFollowing(next)
    if (next) {
      await supabase.from("follows").insert({ follower_id: userId, following_id: profile.id })
    } else {
      await supabase.from("follows").delete()
        .eq("follower_id", userId)
        .eq("following_id", profile.id)
    }
  }

  const displayTags = (profile.tags ?? []).filter((t) => t !== "seed")
  const displayWants = (profile.wants ?? []).slice(0, 3)

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-3 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all"
      onClick={() => router.push(`/profile/${profile.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-slate-400">@{profile.username}</p>
          </div>
        </div>

        {/* Follow button — stopPropagation でカードクリックを防ぐ */}
        <button
          onClick={toggleFollow}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            following
              ? "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {following ? "フォロー中" : "フォロー"}
        </button>
      </div>

      {/* Location */}
      {(profile.home_country || profile.current_location) && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {[profile.home_country, profile.current_location].filter(Boolean).join(" → ")}
        </p>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{profile.bio}</p>
      )}

      {/* Tags */}
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayTags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Wants */}
      {displayWants.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {displayWants.map((value) => {
            const w = WANTS_MAP[value]
            if (!w) return null
            return (
              <span key={value} className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs text-indigo-600">
                {w.emoji} {w.label}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
