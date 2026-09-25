"use client"

import Link from "next/link"
import type { Profile, StudyAbroadHistory } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"

export type OverlapEntry = {
  profile: Profile
  history: StudyAbroadHistory
  overlapWith: StudyAbroadHistory
  overlapMonths: number
}

type Props = {
  entries: OverlapEntry[]
}

function formatPeriod(h: StudyAbroadHistory): string {
  const fmt = (d: string | null) =>
    d ? `${new Date(d).getFullYear()}.${String(new Date(d).getMonth() + 1).padStart(2, "0")}` : "Present"
  return `${fmt(h.start_date)} – ${fmt(h.end_date)}`
}

export function AlumniOverlapList({ entries }: Props) {
  if (entries.length === 0) return null

  // 大学名でグループ化
  const grouped = new Map<string, OverlapEntry[]>()
  for (const entry of entries) {
    const key = entry.history.university_name
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(entry)
  }

  return (
    <div className="flex flex-col gap-4">
      {[...grouped.entries()].map(([university, group]) => (
        <div key={university}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            At the same time at {university}
          </p>
          <div className="flex flex-col gap-2">
            {group.map(({ profile, history, overlapMonths: months }) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{profile.full_name}</p>
                  <p className="text-xs text-slate-400">
                    {formatPeriod(history)}
                    {history.program ? ` · ${history.program}` : ""}
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-600">
                    {months >= 12
                      ? `${Math.floor(months / 12)}y ${months % 12 > 0 ? `${months % 12}m` : ""}`.trim()
                      : `${months}m`} together
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
