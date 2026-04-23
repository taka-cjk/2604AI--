"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import type { ProfileWithFollow } from "@/app/(main)/discover/page"
import { UserCard } from "./UserCard"

const AlumniMap = dynamic(() => import("./AlumniMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-slate-200 flex items-center justify-center" style={{ height: 480 }}>
      <p className="text-sm text-slate-400">地図を読み込み中...</p>
    </div>
  ),
})

type Props = {
  profiles: ProfileWithFollow[]
  userId: string
}

type Tab = "list" | "map"

export function DiscoverClient({ profiles, userId }: Props) {
  const [tab, setTab] = useState<Tab>("list")
  const [query, setQuery] = useState("")
  const [countryFilter, setCountryFilter] = useState("")

  const countries = useMemo(() => {
    const set = new Set<string>()
    profiles.forEach((p) => { if (p.home_country) set.add(p.home_country) })
    return Array.from(set).sort()
  }, [profiles])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return profiles.filter((p) => {
      const matchQuery = !q || p.full_name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
      const matchCountry = !countryFilter || p.home_country === countryFilter
      return matchQuery && matchCountry
    })
  }, [profiles, query, countryFilter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Discover People</h1>
        <p className="text-sm text-slate-500">東アジアのアルムナイを見つけよう</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["list", "map"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "list" ? "一覧" : "マップ"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <>
          {/* 検索・フィルター */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="名前 / username で検索"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {countries.length > 0 && (
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">すべての国</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          <p className="text-xs text-slate-400">{filtered.length}人のアルムナイ</p>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              {query || countryFilter ? "条件に一致するユーザーが見つかりませんでした" : "まだ他のユーザーがいません"}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((profile) => (
                <UserCard key={profile.id} profile={profile} userId={userId} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "map" && (
        <AlumniMap profiles={profiles} />
      )}
    </div>
  )
}
