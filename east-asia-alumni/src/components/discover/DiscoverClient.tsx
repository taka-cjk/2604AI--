"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import type { ProfileWithFollow } from "@/app/(main)/discover/page"
import type { Profile } from "@/types/index"
import { UserCard } from "./UserCard"
import { WANTS_OPTIONS } from "@/data/wants"
import { createClient } from "@/lib/supabase/client"

const AlumniMap = dynamic(() => import("./AlumniMap"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-slate-200 flex items-center justify-center" style={{ height: 480 }}>
      <p className="text-sm text-slate-400">Loading map...</p>
    </div>
  ),
})

type Props = {
  profiles: ProfileWithFollow[]
  userId: string
  initialShowOnMap: boolean
  currentProfile: Profile | null
}

type Tab = "list" | "map"

export function DiscoverClient({ profiles, userId, initialShowOnMap, currentProfile }: Props) {
  const supabase = createClient()
  const [tab, setTab] = useState<Tab>("list")
  const [query, setQuery] = useState("")
  const [countryFilter, setCountryFilter] = useState("")
  const [wantsFilter, setWantsFilter] = useState("")
  const [showOnMap, setShowOnMap] = useState(initialShowOnMap)

  async function handleToggleMap() {
    const next = !showOnMap
    setShowOnMap(next)
    await supabase.from("profiles").update({ show_on_map: next }).eq("id", userId)
  }

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
      const matchWants = !wantsFilter || (p.wants ?? []).includes(wantsFilter)
      return matchQuery && matchCountry && matchWants
    })
  }, [profiles, query, countryFilter, wantsFilter])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">Discover People</h1>
        <p className="text-sm text-slate-500">Connect with East Asian alumni</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-slate-400">Show my usual area on the map</span>
          <button
            onClick={handleToggleMap}
            className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
              showOnMap
                ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                : "border-slate-200 text-slate-400"
            }`}
          >
            {showOnMap ? "Visible" : "Hidden"}
          </button>
        </div>
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
            {t === "list" ? "List" : "Map"}
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
              placeholder="Search by name or username"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {countries.length > 0 && (
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <select
              value={wantsFilter}
              onChange={(e) => setWantsFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All interests</option>
              {WANTS_OPTIONS.map((w) => (
                <option key={w.value} value={w.value}>{w.emoji} {w.label}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-slate-400">{filtered.length} alumni</p>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              {query || countryFilter ? "No users match your criteria" : "No other users yet"}
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
        <AlumniMap
          profiles={[
            ...profiles.filter(p => p.show_on_map),
            ...(showOnMap && currentProfile ? [currentProfile] : []),
          ]}
          centerProfile={currentProfile}
        />
      )}
    </div>
  )
}
