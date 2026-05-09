"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Profile, StudyAbroadHistory, WorkHistory, SnsLinks } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { UniversityCombobox } from "@/components/ui/UniversityCombobox"
import { CompanyCombobox } from "@/components/ui/CompanyCombobox"
import { CityCombobox } from "@/components/ui/CityCombobox"
import { TOKYO_AREAS } from "@/data/areas"
import { WANTS_OPTIONS } from "@/data/wants"

type HistoryForm = {
  university_name: string
  country: string
  program: string
  start_date: string
  end_date: string
}

type WorkForm = {
  company_name: string
  company_name_local: string
  role: string
  location: string
  start_date: string
  end_date: string
}

const emptyHistory: HistoryForm = { university_name: "", country: "", program: "", start_date: "", end_date: "" }
const emptyWork: WorkForm = { company_name: "", company_name_local: "", role: "", location: "", start_date: "", end_date: "" }

const toDate = (month: string) => month ? `${month}-01` : null
const toMonth = (date: string | null) => date ? date.slice(0, 7) : ""

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

export default function ProfileEditPage() {
  const router = useRouter()
  const supabase = createClient()

  // ── Profile ──────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileForm, setProfileForm] = useState({ bio: "", home_country: "", current_location: "", work_location: "" })
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [snsLinks, setSnsLinks] = useState<SnsLinks>({})
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedWants, setSelectedWants] = useState<string[]>([])
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameOk, setUsernameOk] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  // ── Study abroad ─────────────────────────────────────────
  const [histories, setHistories] = useState<StudyAbroadHistory[]>([])
  const [historyForm, setHistoryForm] = useState<HistoryForm>(emptyHistory)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null)
  const [editHistoryForm, setEditHistoryForm] = useState<HistoryForm>(emptyHistory)

  // ── Work history ─────────────────────────────────────────
  const [workHistories, setWorkHistories] = useState<WorkHistory[]>([])
  const [workForm, setWorkForm] = useState<WorkForm>(emptyWork)
  const [workLoading, setWorkLoading] = useState(false)
  const [workError, setWorkError] = useState<string | null>(null)
  const [editingWorkId, setEditingWorkId] = useState<string | null>(null)
  const [editWorkForm, setEditWorkForm] = useState<WorkForm>(emptyWork)

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
      setTags(p.tags ?? [])
      setSnsLinks(p.sns_links ?? {})
      setSelectedAreas(p.area ?? [])
      setSelectedWants(p.wants ?? [])
      setAvatarUrl(p.avatar_url)
      setUsername(p.username ?? "")

      const [{ data: h }, { data: w }] = await Promise.all([
        supabase.from("study_abroad_histories").select("*").eq("profile_id", user.id).order("start_date", { ascending: false }),
        supabase.from("work_histories").select("*").eq("profile_id", user.id).order("start_date", { ascending: false }),
      ])
      setHistories((h ?? []) as StudyAbroadHistory[])
      setWorkHistories((w ?? []) as WorkHistory[])
    }
    load()
  }, [])

  // ── Avatar ───────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarUploading(true)
    const ext = file.name.split(".").pop()
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(`${profile.id}/avatar.${ext}`, file, { upsert: true })
    if (uploadError) {
      alert("Upload failed: " + uploadError.message)
      setAvatarUploading(false)
      return
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(`${profile.id}/avatar.${ext}`)
    const url = `${data.publicUrl}?t=${Date.now()}`
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id)
    setAvatarUrl(url)
    setAvatarUploading(false)
  }

  // ── Username ─────────────────────────────────────────────
  async function handleUsernameChange(val: string) {
    const lower = val.toLowerCase()
    setUsername(lower)
    setUsernameOk(false)
    if (lower === profile?.username) { setUsernameError(null); setUsernameOk(true); return }
    if (!/^[a-z0-9_]{3,20}$/.test(lower)) {
      setUsernameError("3–20 characters: lowercase letters, numbers, underscores only")
      return
    }
    setUsernameError(null)
    const { data } = await supabase.from("profiles").select("id").eq("username", lower).maybeSingle()
    if (data) { setUsernameError("This username is already taken") } else { setUsernameOk(true) }
  }

  // ── Profile save ─────────────────────────────────────────
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || usernameError) return
    setProfileError(null)
    setProfileLoading(true)
    setProfileSaved(false)
    const { error } = await supabase.from("profiles").update({
      username,
      bio: profileForm.bio || null,
      home_country: profileForm.home_country || null,
      current_location: profileForm.current_location || null,
      work_location: profileForm.work_location || null,
      tags,
      sns_links: snsLinks,
      area: selectedAreas,
      wants: selectedWants,
    }).eq("id", profile.id)
    if (error) { setProfileError(error.message) } else { setProfileSaved(true) }
    setProfileLoading(false)
  }

  // ── Study abroad: add ────────────────────────────────────
  async function handleAddHistory(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setHistoryError(null)
    setHistoryLoading(true)
    const { data, error } = await supabase.from("study_abroad_histories").insert({
      profile_id: profile.id,
      university_name: historyForm.university_name,
      country: historyForm.country,
      program: historyForm.program || null,
      start_date: toDate(historyForm.start_date),
      end_date: toDate(historyForm.end_date),
    }).select().single<StudyAbroadHistory>()
    if (error) { setHistoryError(error.message) }
    else if (data) { setHistories((prev) => [data, ...prev]); setHistoryForm(emptyHistory) }
    setHistoryLoading(false)
  }

  // ── Study abroad: delete ──────────────────────────────────
  async function handleDeleteHistory(id: string) {
    await supabase.from("study_abroad_histories").delete().eq("id", id)
    setHistories((prev) => prev.filter((h) => h.id !== id))
  }

  // ── Study abroad: edit ───────────────────────────────────
  function startEditHistory(h: StudyAbroadHistory) {
    setEditingHistoryId(h.id)
    setEditHistoryForm({
      university_name: h.university_name,
      country: h.country,
      program: h.program ?? "",
      start_date: toMonth(h.start_date),
      end_date: toMonth(h.end_date),
    })
  }

  async function handleHistoryEditSave(id: string) {
    setHistoryLoading(true)
    setHistoryError(null)
    const { error } = await supabase.from("study_abroad_histories").update({
      university_name: editHistoryForm.university_name,
      country: editHistoryForm.country,
      program: editHistoryForm.program || null,
      start_date: toDate(editHistoryForm.start_date),
      end_date: toDate(editHistoryForm.end_date),
    }).eq("id", id)
    if (error) {
      setHistoryError(error.message)
    } else {
      setHistories((prev) => prev.map((h) => h.id === id ? {
        ...h,
        university_name: editHistoryForm.university_name,
        country: editHistoryForm.country,
        program: editHistoryForm.program || null,
        start_date: toDate(editHistoryForm.start_date),
        end_date: toDate(editHistoryForm.end_date),
      } : h))
      setEditingHistoryId(null)
    }
    setHistoryLoading(false)
  }

  // ── Work history: add ────────────────────────────────────
  async function handleAddWork(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setWorkError(null)
    setWorkLoading(true)
    const { data, error } = await supabase.from("work_histories").insert({
      profile_id: profile.id,
      company_name: workForm.company_name,
      company_name_local: workForm.company_name_local || null,
      role: workForm.role || null,
      location: workForm.location || null,
      start_date: toDate(workForm.start_date),
      end_date: toDate(workForm.end_date),
    }).select().single<WorkHistory>()
    if (error) { setWorkError(error.message) }
    else if (data) { setWorkHistories((prev) => [data, ...prev]); setWorkForm(emptyWork) }
    setWorkLoading(false)
  }

  // ── Work history: delete ──────────────────────────────────
  async function handleDeleteWork(id: string) {
    await supabase.from("work_histories").delete().eq("id", id)
    setWorkHistories((prev) => prev.filter((w) => w.id !== id))
  }

  // ── Work history: edit ───────────────────────────────────
  function startEditWork(w: WorkHistory) {
    setEditingWorkId(w.id)
    setEditWorkForm({
      company_name: w.company_name,
      company_name_local: w.company_name_local ?? "",
      role: w.role ?? "",
      location: w.location ?? "",
      start_date: toMonth(w.start_date),
      end_date: toMonth(w.end_date),
    })
  }

  async function handleWorkEditSave(id: string) {
    setWorkLoading(true)
    setWorkError(null)
    const { error } = await supabase.from("work_histories").update({
      company_name: editWorkForm.company_name,
      company_name_local: editWorkForm.company_name_local || null,
      role: editWorkForm.role || null,
      location: editWorkForm.location || null,
      start_date: toDate(editWorkForm.start_date),
      end_date: toDate(editWorkForm.end_date),
    }).eq("id", id)
    if (error) {
      setWorkError(error.message)
    } else {
      setWorkHistories((prev) => prev.map((w) => w.id === id ? {
        ...w,
        company_name: editWorkForm.company_name,
        company_name_local: editWorkForm.company_name_local || null,
        role: editWorkForm.role || null,
        location: editWorkForm.location || null,
        start_date: toDate(editWorkForm.start_date),
        end_date: toDate(editWorkForm.end_date),
      } : w))
      setEditingWorkId(null)
    }
    setWorkLoading(false)
  }

  const profileSaveBtn = (
    <button
      type="submit"
      form="profile-form"
      disabled={profileLoading}
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
    >
      {profileLoading ? "Saving..." : "Save"}
    </button>
  )

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Edit profile</h1>
        <div className="flex items-center gap-3">
          {profileSaveBtn}
          <Link href="/profile/me" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back
          </Link>
        </div>
      </div>

      {/* Avatar */}
      <section className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={profile?.full_name ?? "?"} avatarUrl={avatarUrl} size="lg" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          >
            <span className="text-white text-xs font-medium">{avatarUploading ? "..." : "Edit"}</span>
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Profile photo</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="mt-1 text-xs text-indigo-600 hover:underline disabled:opacity-50"
          >
            {avatarUploading ? "Uploading..." : "Choose image (JPG / PNG / WebP · max 2MB)"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarChange} className="hidden" />
        </div>
      </section>

      {/* Profile form */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Basic info</h2>
        <form id="profile-form" onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pl-7 text-sm outline-none focus:ring-2 focus:ring-indigo-100 ${
                  usernameError ? "border-red-400 focus:border-red-400" :
                  usernameOk && username !== profile?.username ? "border-green-400 focus:border-green-400" :
                  "border-slate-300 focus:border-indigo-500"
                }`}
                placeholder="your_name"
                maxLength={20}
              />
            </div>
            {usernameError && <p className="mt-1 text-xs text-red-500">{usernameError}</p>}
            {usernameOk && username !== profile?.username && <p className="mt-1 text-xs text-green-600">Available</p>}
            <p className="mt-1 text-xs text-slate-400">3–20 chars, lowercase letters, numbers, underscores</p>
          </div>

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

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">#Words that represent you</label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-lg border border-slate-300 px-3 py-2 text-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                <span className="text-slate-400 select-none">#</span>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value.replace(/^#/, ""))}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                      e.preventDefault()
                      const newTag = tagInput.trim().replace(/,$/, "")
                      if (newTag && !tags.includes(newTag)) setTags((t) => [...t, newTag])
                      setTagInput("")
                    }
                  }}
                  placeholder="Beijing, #Startup, #Exchange student"
                  className="flex-1 outline-none bg-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const newTag = tagInput.trim()
                  if (newTag && !tags.includes(newTag)) setTags((t) => [...t, newTag])
                  setTagInput("")
                }}
                disabled={!tagInput.trim()}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {tags.filter(t => t !== "seed").length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.filter(t => t !== "seed").map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                    #{tag}
                    <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))} className="hover:text-slate-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Home country</label>
              <input type="text" value={profileForm.home_country} onChange={(e) => setProfileForm((f) => ({ ...f, home_country: e.target.value }))} className={inputClass} placeholder="Japan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current location</label>
              <CityCombobox value={profileForm.current_location} onChange={(name) => setProfileForm((f) => ({ ...f, current_location: name }))} placeholder="Tokyo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work location</label>
              <CityCombobox value={profileForm.work_location} onChange={(name) => setProfileForm((f) => ({ ...f, work_location: name }))} placeholder="Tokyo" />
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Your usual area (Tokyo)</label>
            <div className="flex flex-wrap gap-2">
              {TOKYO_AREAS.map((a) => {
                const checked = selectedAreas.includes(a.name)
                return (
                  <label key={a.name} className={`flex items-center gap-1.5 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${checked ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => setSelectedAreas((prev) => checked ? prev.filter((x) => x !== a.name) : [...prev, a.name])} />
                    {a.label}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Wants */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">What you're looking for</label>
            <div className="flex flex-wrap gap-2">
              {WANTS_OPTIONS.map((w) => {
                const checked = selectedWants.includes(w.value)
                return (
                  <label key={w.value} className={`flex items-center gap-1.5 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${checked ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => setSelectedWants((prev) => checked ? prev.filter((x) => x !== w.value) : [...prev, w.value])} />
                    {w.emoji} {w.label}
                  </label>
                )
              })}
            </div>
          </div>

          {/* SNS links */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">SNS & contacts</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                { key: "x", label: "X (Twitter)", placeholder: "username (no @)" },
                { key: "instagram", label: "Instagram", placeholder: "username" },
                { key: "facebook", label: "Facebook", placeholder: "profile URL or username" },
                { key: "wechat", label: "WeChat", placeholder: "WeChat ID" },
                { key: "line", label: "LINE", placeholder: "LINE ID" },
                { key: "kakao", label: "Kakao Talk", placeholder: "Kakao ID" },
                { key: "note", label: "note", placeholder: "username" },
                { key: "wantedly", label: "Wantedly", placeholder: "profile URL" },
                { key: "youtrust", label: "YOUTRUST", placeholder: "profile URL" },
              ] as { key: keyof typeof snsLinks; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-24 shrink-0 text-xs text-slate-500">{label}</span>
                  <input
                    type="text"
                    value={snsLinks[key] ?? ""}
                    onChange={(e) => setSnsLinks((s) => ({ ...s, [key]: e.target.value || undefined }))}
                    placeholder={placeholder}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
            </div>
          </div>

          {profileError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{profileError}</p>}
          {profileSaved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">Saved!</p>}

          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {profileLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>

      {/* Study abroad */}
      <section id="study">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Study abroad history</h2>

        {histories.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {histories.map((h) => (
              <li key={h.id} className="rounded-lg border border-slate-200 px-4 py-3">
                {editingHistoryId === h.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">University *</label>
                        <UniversityCombobox
                          required
                          value={editHistoryForm.university_name}
                          onChange={(name, country) => setEditHistoryForm((f) => ({ ...f, university_name: name, ...(country ? { country } : {}) }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Country *</label>
                        <input type="text" required value={editHistoryForm.country} onChange={(e) => setEditHistoryForm((f) => ({ ...f, country: e.target.value }))} className={inputClass} placeholder="China" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Program</label>
                        <input type="text" value={editHistoryForm.program} onChange={(e) => setEditHistoryForm((f) => ({ ...f, program: e.target.value }))} className={inputClass} placeholder="CAMPUS Asia" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
                          <input type="month" value={editHistoryForm.start_date} onChange={(e) => setEditHistoryForm((f) => ({ ...f, start_date: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
                          <input type="month" value={editHistoryForm.end_date} onChange={(e) => setEditHistoryForm((f) => ({ ...f, end_date: e.target.value }))} className={inputClass} />
                        </div>
                      </div>
                    </div>
                    {historyError && <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">{historyError}</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingHistoryId(null)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                      <button type="button" onClick={() => handleHistoryEditSave(h.id)} disabled={historyLoading}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                        {historyLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{h.university_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{h.country}{h.program ? ` · ${h.program}` : ""}</p>
                      {(h.start_date || h.end_date) && (
                        <p className="text-xs text-slate-400 mt-0.5">{toMonth(h.start_date) || "?"} – {toMonth(h.end_date) || "present"}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button type="button" onClick={() => startEditHistory(h)} className="text-xs text-indigo-500 hover:text-indigo-700">Edit</button>
                      <button type="button" onClick={() => handleDeleteHistory(h.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {historyError && editingHistoryId === null && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{historyError}</p>}

        <form onSubmit={handleAddHistory} className="flex flex-col gap-4 rounded-lg border border-dashed border-slate-300 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add new</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">University *</label>
              <UniversityCombobox
                required
                value={historyForm.university_name}
                onChange={(name, country) => setHistoryForm((f) => ({ ...f, university_name: name, ...(country ? { country } : {}) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
              <input type="text" required value={historyForm.country} onChange={(e) => setHistoryForm((f) => ({ ...f, country: e.target.value }))} className={inputClass} placeholder="China" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
              <input type="text" value={historyForm.program} onChange={(e) => setHistoryForm((f) => ({ ...f, program: e.target.value }))} className={inputClass} placeholder="CAMPUS Asia" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input type="month" value={historyForm.start_date} onChange={(e) => setHistoryForm((f) => ({ ...f, start_date: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input type="month" value={historyForm.end_date} onChange={(e) => setHistoryForm((f) => ({ ...f, end_date: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={historyLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {historyLoading ? "Adding..." : "+ Add"}
            </button>
          </div>
        </form>
      </section>

      {/* Work history */}
      <section id="work">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Work history</h2>

        {workHistories.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {workHistories.map((w) => (
              <li key={w.id} className="rounded-lg border border-slate-200 px-4 py-3">
                {editingWorkId === w.id ? (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Company (English) *</label>
                        <CompanyCombobox
                          required
                          value={editWorkForm.company_name}
                          valueLocal={editWorkForm.company_name_local}
                          onChange={(name, nameLocal) => setEditWorkForm((f) => ({ ...f, company_name: name, company_name_local: nameLocal ?? f.company_name_local }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Company (local language)</label>
                        <input type="text" value={editWorkForm.company_name_local} onChange={(e) => setEditWorkForm((f) => ({ ...f, company_name_local: e.target.value }))} className={inputClass} placeholder="字节跳动" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Role / Position</label>
                        <input type="text" value={editWorkForm.role} onChange={(e) => setEditWorkForm((f) => ({ ...f, role: e.target.value }))} className={inputClass} placeholder="Software Engineer" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Location</label>
                        <input type="text" value={editWorkForm.location} onChange={(e) => setEditWorkForm((f) => ({ ...f, location: e.target.value }))} className={inputClass} placeholder="Tokyo" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
                          <input type="month" value={editWorkForm.start_date} onChange={(e) => setEditWorkForm((f) => ({ ...f, start_date: e.target.value }))} className={inputClass} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
                          <input type="month" value={editWorkForm.end_date} onChange={(e) => setEditWorkForm((f) => ({ ...f, end_date: e.target.value }))} className={inputClass} />
                        </div>
                      </div>
                    </div>
                    {workError && <p className="text-xs text-red-500 bg-red-50 rounded px-2 py-1">{workError}</p>}
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditingWorkId(null)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                      <button type="button" onClick={() => handleWorkEditSave(w.id)} disabled={workLoading}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                        {workLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {w.company_name}
                        {w.company_name_local && <span className="ml-2 text-xs font-normal text-slate-400">{w.company_name_local}</span>}
                      </p>
                      {(w.role || w.location) && (
                        <p className="text-xs text-slate-500 mt-0.5">{[w.role, w.location].filter(Boolean).join(" · ")}</p>
                      )}
                      {(w.start_date || w.end_date) && (
                        <p className="text-xs text-slate-400 mt-0.5">{toMonth(w.start_date) || "?"} – {toMonth(w.end_date) || "present"}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <button type="button" onClick={() => startEditWork(w)} className="text-xs text-indigo-500 hover:text-indigo-700">Edit</button>
                      <button type="button" onClick={() => handleDeleteWork(w.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {workError && editingWorkId === null && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{workError}</p>}

        <form onSubmit={handleAddWork} className="flex flex-col gap-4 rounded-lg border border-dashed border-slate-300 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Add new</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company (English) *</label>
              <CompanyCombobox
                required
                value={workForm.company_name}
                valueLocal={workForm.company_name_local}
                onChange={(name, nameLocal) => setWorkForm((f) => ({ ...f, company_name: name, company_name_local: nameLocal ?? f.company_name_local }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company (local language)</label>
              <input type="text" value={workForm.company_name_local} onChange={(e) => setWorkForm((f) => ({ ...f, company_name_local: e.target.value }))} className={inputClass} placeholder="字节跳動" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role / Position</label>
              <input type="text" value={workForm.role} onChange={(e) => setWorkForm((f) => ({ ...f, role: e.target.value }))} className={inputClass} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input type="text" value={workForm.location} onChange={(e) => setWorkForm((f) => ({ ...f, location: e.target.value }))} className={inputClass} placeholder="Tokyo" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                <input type="month" value={workForm.start_date} onChange={(e) => setWorkForm((f) => ({ ...f, start_date: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                <input type="month" value={workForm.end_date} onChange={(e) => setWorkForm((f) => ({ ...f, end_date: e.target.value }))} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={workLoading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {workLoading ? "Adding..." : "+ Add"}
            </button>
          </div>
        </form>
      </section>

      {/* Bottom save for profile */}
      <div className="flex justify-end pb-4">
        {profileSaveBtn}
      </div>

    </div>
  )
}
