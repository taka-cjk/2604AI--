"use client"

import { useState, useMemo } from "react"
import type { ProfileWithFollow } from "@/app/(main)/discover/page"
import { UserCard } from "./UserCard"

type Props = {
  profiles: ProfileWithFollow[]
  userId: string
}

export function DiscoverClient({ profiles, userId }: Props) {
  const [query, setQuery] = useState("")
  const [countryFilter, setCountryFilter] = useState("")

  // 国フィルターの選択肢（home_country のユニーク値）
  const countries = useMemo(() => {
    const set = new Set<string>()
    profiles.forEach((p) => {
      if (p.home_country) set.add(p.home_country)
    })
    return Array.from(set).sort()
  }, [profiles])

  // クライアントサイドでフィルタリング
  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return profiles.filter((p) => {
      const matchQuery =
        !q ||
        p.full_name.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
      const matchCountry =
        !countryFilter || p.home_country === countryFilter
      return matchQuery && matchCountry
    })
  }, [profiles, query, countryFilter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Discover People</h1>
        <p className="text-sm text-slate-500">東アジアのアルムナイを見つけよう</p>
      </div>

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
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 件数 */}
      <p className="text-xs text-slate-400">{filtered.length}人のアルムナイ</p>

      {/* ユーザー一覧 */}
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
    </div>
  )
}
