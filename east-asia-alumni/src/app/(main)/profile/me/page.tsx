import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile, StudyAbroadHistory, WorkHistory } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { CareerTimeline } from "@/components/profile/CareerTimeline"
import { AlumniOverlapList, type OverlapEntry } from "@/components/profile/AlumniOverlapList"
import { WANTS_MAP } from "@/data/wants"

function toDate(s: string | null | undefined): Date {
  return s ? new Date(s) : new Date()
}

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

function overlaps(a: StudyAbroadHistory, b: StudyAbroadHistory): boolean {
  if (a.university_name !== b.university_name) return false
  return toDate(a.start_date) <= toDate(b.end_date) &&
         toDate(b.start_date) <= toDate(a.end_date)
}

export default async function MyProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  if (!profile) redirect("/auth/onboarding")

  const [
    { data: histories },
    { data: workHistoriesRaw },
    { count: followingCount },
    { count: followersCount },
  ] = await Promise.all([
    supabase
      .from("study_abroad_histories")
      .select("*")
      .eq("profile_id", user.id)
      .order("start_date", { ascending: true }),
    supabase
      .from("work_histories")
      .select("*")
      .eq("profile_id", user.id)
      .order("start_date", { ascending: true }),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user.id),
  ])

  const typedHistories = (histories ?? []) as StudyAbroadHistory[]
  const typedWorks = (workHistoriesRaw ?? []) as WorkHistory[]

  // 同じ大学にいた他ユーザーを検索
  const universityNames = [...new Set(typedHistories.map((h) => h.university_name))]
  let overlapEntries: OverlapEntry[] = []

  if (universityNames.length > 0) {
    const { data: otherHistories } = await supabase
      .from("study_abroad_histories")
      .select("*")
      .in("university_name", universityNames)
      .neq("profile_id", user.id)

    const filtered = (otherHistories ?? []) as StudyAbroadHistory[]
    const overlapPairs = filtered.flatMap((other) => {
      const mine = typedHistories.find((h) => overlaps(h, other))
      return mine ? [{ other, mine }] : []
    })

    if (overlapPairs.length > 0) {
      const profileIds = [...new Set(overlapPairs.map((p) => p.other.profile_id))]
      const { data: profilesRaw } = await supabase
        .from("profiles")
        .select("*")
        .in("id", profileIds)

      const profileMap = Object.fromEntries(
        (profilesRaw ?? []).map((p) => [p.id, p as Profile])
      )

      overlapEntries = overlapPairs
        .filter((p) => profileMap[p.other.profile_id])
        .map((p) => ({
          profile: profileMap[p.other.profile_id],
          history: p.other,
          overlapWith: p.mine,
        }))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <Link
            href="/profile/edit"
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Edit profile
          </Link>
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

      {/* Member badge */}
      {profile.member_number != null && (
        <p className="text-xs text-slate-400">
          Member #{profile.member_number} · Joined {formatJoinDate(profile.created_at)} · {formatTenure(profile.created_at)}
        </p>
      )}

      {/* Follow counts */}
      <div className="flex gap-4 text-sm">
        <Link href="/profile/me/following" className="hover:underline">
          <span className="font-semibold text-slate-900">{followingCount ?? 0}</span>
          <span className="text-slate-500 ml-1">Following</span>
        </Link>
        <Link href="/profile/me/followers" className="hover:underline">
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
          {([
            { key: "instagram", label: "Instagram", bg: "bg-[#C13584]", url: (v: string) => v.startsWith("http") ? v : `https://instagram.com/${v}` },
            { key: "facebook",  label: "Facebook",  bg: "bg-[#1877F2]", url: (v: string) => v.startsWith("http") ? v : `https://www.facebook.com/profile.php?id=${v}` },
            { key: "linkedin",  label: "LinkedIn",  bg: "bg-[#0A66C2]", url: (v: string) => v.startsWith("http") ? v : `https://www.linkedin.com/in/${v}` },
          ] as { key: string; label: string; bg: string; url: (v: string) => string }[]).map(({ key, label, bg, url }) => {
            const val = (profile.sns_links as Record<string, string> | null)?.[key]
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
          {([
            { key: "wechat", label: "WeChat", filledClass: "border-[#07C160] bg-green-50 text-green-800" },
            { key: "line",   label: "LINE",   filledClass: "border-[#00B900] bg-green-50 text-green-800" },
            { key: "kakao",  label: "Kakao",  filledClass: "border-[#FEE500] bg-[#FEE500] text-[#3A1D1D]" },
          ] as { key: string; label: string; filledClass: string }[]).map(({ key, label, filledClass }) => {
            const val = (profile.sns_links as Record<string, string> | null)?.[key]
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Career</h2>
          <Link href="/profile/edit" className="text-xs text-indigo-600 hover:underline">
            + Add
          </Link>
        </div>
        <CareerTimeline studies={typedHistories} works={typedWorks} />
      </div>

      {/* 同じ大学にいた人 */}
      {overlapEntries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Alumni from the same university</h2>
          <AlumniOverlapList entries={overlapEntries} />
        </div>
      )}
    </div>
  )
}
