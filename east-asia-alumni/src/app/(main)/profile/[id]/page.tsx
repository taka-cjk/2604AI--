import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, StudyAbroadHistory } from "@/types/index"
import { WANTS_MAP } from "@/data/wants"
import { Avatar } from "@/components/ui/Avatar"
import { StudyTimeline } from "@/components/profile/StudyTimeline"
import { FollowButton } from "@/components/profile/FollowButton"

type Props = { params: Promise<{ id: string }> }

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (id === user.id) redirect("/profile/me")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single<Profile>()

  if (!profile) notFound()

  const { data: histories } = await supabase
    .from("study_abroad_histories")
    .select("*")
    .eq("profile_id", id)
    .order("start_date", { ascending: true })

  const typedHistories = (histories ?? []) as StudyAbroadHistory[]

  const { data: followRow } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", id)
    .maybeSingle()

  const isFollowing = !!followRow

  const openSns = [
    { key: "x", label: "X", url: (v: string) => `https://x.com/${v}` },
    { key: "instagram", label: "Instagram", url: (v: string) => `https://instagram.com/${v}` },
    { key: "facebook", label: "Facebook", url: (v: string) => v.startsWith("http") ? v : `https://facebook.com/${v}` },
    { key: "note", label: "note", url: (v: string) => `https://note.com/${v}` },
    { key: "wantedly", label: "Wantedly", url: (v: string) => v.startsWith("http") ? v : `https://wantedly.com/id/${v}` },
    { key: "youtrust", label: "YOUTRUST", url: (v: string) => v.startsWith("http") ? v : `https://youtrust.jp/users/${v}` },
  ]
  const snsLinks = profile.sns_links as Record<string, string> | null
  const visibleSns = openSns.filter((s) => snsLinks?.[s.key])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{profile.full_name}</h1>
            <p className="text-sm text-slate-500">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm text-slate-700">{profile.bio}</p>}
          </div>
        </div>
        <FollowButton targetId={id} currentUserId={user.id} initialFollowing={isFollowing} />
      </div>

      {/* Location */}
      {(profile.home_country || profile.current_location) && (
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {[profile.home_country, profile.current_location].filter(Boolean).join(" → ")}
        </p>
      )}

      {/* Tags */}
      {profile.tags && profile.tags.filter((t: string) => t !== "seed").length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.tags.filter((t: string) => t !== "seed").map((tag: string) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Wants */}
      {profile.wants && profile.wants.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">🎯 今、求めていること</p>
          <div className="flex flex-wrap gap-2">
            {profile.wants.map((value: string) => {
              const w = WANTS_MAP[value]
              if (!w) return null
              return (
                <span key={value} className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs text-indigo-700">
                  {w.emoji} {w.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Open SNS */}
      {visibleSns.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleSns.map(({ key, label, url }) => (
            <a
              key={key}
              href={url(snsLinks![key])}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      )}

      {/* Study timeline */}
      {typedHistories.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">留学歴</h2>
          <StudyTimeline histories={typedHistories} />
        </div>
      )}
    </div>
  )
}
