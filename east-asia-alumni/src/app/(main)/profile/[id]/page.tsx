import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile, StudyAbroadHistory, WorkHistory } from "@/types/index"
import { WANTS_MAP } from "@/data/wants"
import { Avatar } from "@/components/ui/Avatar"
import { CareerTimeline } from "@/components/profile/CareerTimeline"
import { FollowButton } from "@/components/profile/FollowButton"

type Props = { params: Promise<{ id: string }> }

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
function formatJoinDate(iso: string) {
  const d = new Date(iso)
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${ordinal(d.getDate())} ${d.getFullYear()}`
}
function formatTenure(iso: string) {
  const joined = new Date(iso)
  const now = new Date()
  const total = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth())
  const y = Math.floor(total / 12)
  const m = total % 12
  return `${y}y ${m}m`
}

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

  const [
    { data: histories },
    { data: workHistoriesRaw },
  ] = await Promise.all([
    supabase
      .from("study_abroad_histories")
      .select("*")
      .eq("profile_id", id)
      .order("start_date", { ascending: true }),
    supabase
      .from("work_histories")
      .select("*")
      .eq("profile_id", id)
      .order("start_date", { ascending: true }),
  ])

  const typedHistories = (histories ?? []) as StudyAbroadHistory[]
  const typedWorks = (workHistoriesRaw ?? []) as WorkHistory[]

  const [
    { data: followRow },
    { count: followingCount },
    { count: followersCount },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle(),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", id),
  ])

  const isFollowing = !!followRow

  const openSns = [
    { key: "instagram", label: "Instagram", url: (v: string) => v.startsWith("http") ? v : `https://instagram.com/${v}` },
    { key: "facebook",  label: "Facebook",  url: (v: string) => v.startsWith("http") ? v : `https://www.facebook.com/profile.php?id=${v}` },
    { key: "linkedin",  label: "LinkedIn",  url: (v: string) => v.startsWith("http") ? v : `https://www.linkedin.com/in/${v}` },
  ]
  const closedSns = [
    { key: "wechat", label: "WeChat" },
    { key: "line", label: "LINE" },
    { key: "kakao", label: "Kakao" },
  ]
  const snsLinks = profile.sns_links as Record<string, string> | null
  const visibleSns = openSns.filter((s) => snsLinks?.[s.key])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <div className="flex gap-2">
            <Link
              href={`/messages/${id}`}
              className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Message
            </Link>
            <FollowButton targetId={id} currentUserId={user.id} initialFollowing={isFollowing} />
          </div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm text-slate-700 leading-relaxed">{profile.bio}</p>}
        </div>
      </div>

      {/* Tags */}
      {profile.tags?.filter((t: string) => t !== "seed").length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.tags.filter((t: string) => t !== "seed").map((tag: string) => (
            <span key={tag} className="text-xs text-slate-700 font-medium">#{tag}</span>
          ))}
        </div>
      )}

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

      {/* Member badge */}
      {profile.member_number != null && (
        <p className="text-xs text-slate-400">
          Member #{profile.member_number} · Joined {formatJoinDate(profile.created_at)} · {formatTenure(profile.created_at)}
        </p>
      )}

      {/* Follow counts */}
      <div className="flex gap-4 text-sm">
        <Link href={`/profile/${id}/following`} className="hover:underline">
          <span className="font-semibold text-slate-900">{followingCount ?? 0}</span>
          <span className="text-slate-500 ml-1">Following</span>
        </Link>
        <Link href={`/profile/${id}/followers`} className="hover:underline">
          <span className="font-semibold text-slate-900">{followersCount ?? 0}</span>
          <span className="text-slate-500 ml-1">Followers</span>
        </Link>
      </div>

      {/* Wants */}
      {profile.wants && profile.wants.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">🎯 Looking for</p>
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

      {/* SNS links */}
      <div className="flex flex-col gap-2">
        {/* IG / FB / LinkedIn — 常に3つ表示 */}
        <div className="flex flex-wrap gap-2">
          {openSns.map(({ key, label, url }) => {
            const val = snsLinks?.[key]
            const bg = key === "instagram" ? "bg-[#C13584]" : key === "facebook" ? "bg-[#1877F2]" : "bg-[#0A66C2]"
            if (val) return (
              <a key={key} href={url(val)} target="_blank" rel="noopener noreferrer"
                className={`rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity ${bg}`}>
                {label}
              </a>
            )
            return (
              <span key={key} className="rounded-full border border-dashed border-slate-200 px-4 py-1.5 text-xs text-slate-300">
                {label}
              </span>
            )
          })}
        </div>

        {/* WeChat / LINE / Kakao — ID表示 */}
        <div className="flex flex-wrap gap-2">
          {closedSns.map(({ key, label }) => {
            const val = snsLinks?.[key]
            const filledClass = key === "wechat" ? "border-[#07C160] bg-green-50 text-green-800"
              : key === "line" ? "border-[#00B900] bg-green-50 text-green-800"
              : "border-[#FEE500] bg-[#FEE500] text-[#3A1D1D]"
            return (
              <span key={key}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${val ? filledClass : "border-dashed border-slate-200 text-slate-300"}`}>
                {label}{val ? `: ${val}` : ""}
              </span>
            )
          })}
        </div>
      </div>

      {/* Career timeline */}
      {(typedHistories.length > 0 || typedWorks.length > 0) && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Career</h2>
          <CareerTimeline studies={typedHistories} works={typedWorks} />
        </div>
      )}
    </div>
  )
}
