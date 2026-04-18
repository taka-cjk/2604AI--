"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile, StudyAbroadHistory } from "@/types/index"

type HistoryForm = {
  university_name: string
  country: string
  program: string
  start_date: string
  end_date: string
}

const emptyHistory: HistoryForm = {
  university_name: "",
  country: "",
  program: "",
  start_date: "",
  end_date: "",
}

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [histories, setHistories] = useState<StudyAbroadHistory[]>([])
  const [profileForm, setProfileForm] = useState({ bio: "", home_country: "", current_location: "", work_location: "" })
  const [historyForm, setHistoryForm] = useState<HistoryForm>(emptyHistory)
  const [profileLoading, setProfileLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>()
      if (!p) { router.push("/auth/onboarding"); return }

      setProfile(p)
      setProfileForm({
        bio: p.bio ?? "",
        home_country: p.home_country ?? "",
        current_location: p.current_location ?? "",
        work_location: p.work_location ?? "",
      })

      const { data: h } = await supabase
        .from("study_abroad_histories")
        .select("*")
        .eq("profile_id", user.id)
        .order("start_date", { ascending: false })
      setHistories((h ?? []) as StudyAbroadHistory[])
    }
    load()
  }, [])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setProfileError(null)
    setProfileLoading(true)
    setProfileSaved(false)

    const { error } = await supabase.from("profiles").update({
      bio: profileForm.bio || null,
      home_country: profileForm.home_country || null,
      current_location: profileForm.current_location || null,
      work_location: profileForm.work_location || null,
    }).eq("id", profile.id)

    if (error) {
      setProfileError(error.message)
    } else {
      setProfileSaved(true)
    }
    setProfileLoading(false)
  }

  async function handleAddHistory(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setHistoryError(null)
    setHistoryLoading(true)

    const toDate = (month: string) => month ? `${month}-01` : null

    const { data, error } = await supabase.from("study_abroad_histories").insert({
      profile_id: profile.id,
      university_name: historyForm.university_name,
      country: historyForm.country,
      program: historyForm.program || null,
      start_date: toDate(historyForm.start_date),
      end_date: toDate(historyForm.end_date),
    }).select().single<StudyAbroadHistory>()

    if (error) {
      setHistoryError(error.message)
    } else if (data) {
      setHistories((prev) => [data, ...prev])
      setHistoryForm(emptyHistory)
    }
    setHistoryLoading(false)
  }

  async function handleDeleteHistory(id: string) {
    await supabase.from("study_abroad_histories").delete().eq("id", id)
    setHistories((prev) => prev.filter((h) => h.id !== id))
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Edit profile</h1>
        <button
          onClick={() => router.push("/profile/me")}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back
        </button>
      </div>

      {/* Profile form */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Basic info</h2>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
            <textarea
              rows={3}
              value={profileForm.bio}
              onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
              placeholder="Tell people about yourself"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { key: "home_country", label: "Home country" },
              { key: "current_location", label: "Current location" },
              { key: "work_location", label: "Work location" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={profileForm[key as keyof typeof profileForm]}
                  onChange={(e) => setProfileForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder={label}
                />
              </div>
            ))}
          </div>

          {profileError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{profileError}</p>}
          {profileSaved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Saved!</p>}

          <button
            type="submit"
            disabled={profileLoading}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {profileLoading ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      {/* Study abroad */}
      <section id="study">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Study abroad history</h2>

        {/* Existing entries */}
        {histories.length > 0 && (
          <ul className="flex flex-col gap-2 mb-6">
            {histories.map((h) => (
              <li key={h.id} className="flex items-start justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{h.university_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {h.country}{h.program ? ` · ${h.program}` : ""}
                  </p>
                  {(h.start_date || h.end_date) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {h.start_date ?? "?"} – {h.end_date ?? "present"}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteHistory(h.id)}
                  className="ml-4 text-xs text-red-400 hover:text-red-600 shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new */}
        <form onSubmit={handleAddHistory} className="flex flex-col gap-4 rounded-lg border border-dashed border-slate-300 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add new</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">University *</label>
              <input
                type="text"
                required
                value={historyForm.university_name}
                onChange={(e) => setHistoryForm((f) => ({ ...f, university_name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Peking University"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
              <input
                type="text"
                required
                value={historyForm.country}
                onChange={(e) => setHistoryForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="China"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
              <input
                type="text"
                value={historyForm.program}
                onChange={(e) => setHistoryForm((f) => ({ ...f, program: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="CAMPUS Asia"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input
                  type="month"
                  value={historyForm.start_date}
                  onChange={(e) => setHistoryForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input
                  type="month"
                  value={historyForm.end_date}
                  onChange={(e) => setHistoryForm((f) => ({ ...f, end_date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {historyError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{historyError}</p>}

          <button
            type="submit"
            disabled={historyLoading}
            className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {historyLoading ? "Adding..." : "+ Add"}
          </button>
        </form>
      </section>
    </div>
  )
}
