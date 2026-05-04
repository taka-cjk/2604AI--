import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile, StudyAbroadHistory } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { StudyTimeline } from "@/components/profile/StudyTimeline"
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

  const { data: histories } = await supabase
    .from("study_abroad_histories")
    .select("*")
    .eq("profile_id", user.id)
    .order("start_date", { ascending: true })

  const typedHistories = (histories ?? []) as StudyAbroadHistory[]

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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{profile.full_name}</h1>
            <p className="text-sm text-slate-500">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm text-slate-700">{profile.bio}</p>}
            {profile.tags?.filter((t: string) => t !== "seed").length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.tags.filter((t: string) => t !== "seed").map((tag: string) => (
                  <span key={tag} className="text-xs text-indigo-500 font-medium">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Edit profile
        </Link>
      </div>

      {/* Member badge */}
      {profile.member_number != null && (
        <p className="text-xs text-slate-400">
          Member #{profile.member_number} · Joined {formatJoinDate(profile.created_at)} · {formatTenure(profile.created_at)}
        </p>
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

      {/* SNS links */}
      {profile.sns_links && (
        <div className="flex flex-col gap-3">
          {/* Open SNS（入力があるものだけ表示） */}
          {(() => {
            const openSns = [
              { key: "x", label: "X", url: (v: string) => `https://x.com/${v}` },
              { key: "instagram", label: "Instagram", url: (v: string) => `https://instagram.com/${v}` },
              { key: "facebook", label: "Facebook", url: (v: string) => v.startsWith("http") ? v : `https://facebook.com/${v}` },
              { key: "note", label: "note", url: (v: string) => `https://note.com/${v}` },
              { key: "wantedly", label: "Wantedly", url: (v: string) => v.startsWith("http") ? v : `https://wantedly.com/id/${v}` },
              { key: "youtrust", label: "YOUTRUST", url: (v: string) => v.startsWith("http") ? v : `https://youtrust.jp/users/${v}` },
            ]
            const links = openSns.filter(s => (profile.sns_links as Record<string, string>)?.[s.key])
            if (links.length === 0) return null
            return (
              <div className="flex flex-wrap gap-2">
                {links.map(({ key, label, url }) => {
                  const val = (profile.sns_links as Record<string, string>)[key]
                  return (
                    <a key={key} href={url(val)} target="_blank" rel="noopener noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                      {label}
                    </a>
                  )
                })}
              </div>
            )
          })()}

          {/* Closed SNS（常に表示、未入力はNot set） */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "line", label: "LINE" },
              { key: "wechat", label: "WeChat" },
              { key: "kakao", label: "Kakao" },
            ].map(({ key, label }) => {
              const val = (profile.sns_links as Record<string, string>)?.[key]
              return (
                <span key={key}
                  className={`rounded-full border px-3 py-1 text-xs ${val ? "border-slate-200 text-slate-600" : "border-dashed border-slate-200 text-slate-400"}`}
                  title={val ? `${label}: ${val}` : undefined}>
                  {label}: {val ?? "Not set"}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Study abroad timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">留学歴</h2>
          <Link href="/profile/edit#study" className="text-xs text-indigo-600 hover:underline">
            + Add
          </Link>
        </div>
        <StudyTimeline histories={typedHistories} />
      </div>

      {/* 同じ大学にいた人 */}
      {overlapEntries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-4">同じ大学にいた人</h2>
          <AlumniOverlapList entries={overlapEntries} />
        </div>
      )}
    </div>
  )
}
