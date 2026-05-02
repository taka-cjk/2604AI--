"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Profile, StudyAbroadHistory, SnsLinks } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { UniversityCombobox } from "@/components/ui/UniversityCombobox"
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
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [historyForm, setHistoryForm] = useState<HistoryForm>(emptyHistory)
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
      setTags(p.tags ?? [])
      setSnsLinks(p.sns_links ?? {})
      setSelectedAreas(p.area ?? [])
      setSelectedWants(p.wants ?? [])
      setAvatarUrl(p.avatar_url)
      setUsername(p.username ?? "")

      const { data: h } = await supabase
        .from("study_abroad_histories")
        .select("*")
        .eq("profile_id", user.id)
        .order("start_date", { ascending: false })
      setHistories((h ?? []) as StudyAbroadHistory[])
    }
    load()
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setAvatarUploading(true)

    const ext = file.name.split(".").pop()
    const path = `${profile.id}/avatar.${ext}?t=${Date.now()}`

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(`${profile.id}/avatar.${ext}`, file, { upsert: true })

    if (uploadError) {
      alert("アップロードに失敗しました: " + uploadError.message)
      setAvatarUploading(false)
      return
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(`${profile.id}/avatar.${ext}`)
    const url = `${data.publicUrl}?t=${Date.now()}`

    await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id)
    setAvatarUrl(url)
    setAvatarUploading(false)
  }

  async function handleUsernameChange(val: string) {
    const lower = val.toLowerCase()
    setUsername(lower)
    setUsernameOk(false)

    if (lower === profile?.username) {
      setUsernameError(null)
      setUsernameOk(true)
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(lower)) {
      setUsernameError("3〜20文字、英小文字・数字・アンダースコアのみ使えます")
      return
    }
    setUsernameError(null)

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", lower)
      .maybeSingle()
    if (data) {
      setUsernameError("このユーザー名はすでに使われています")
    } else {
      setUsernameOk(true)
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (usernameError) return
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

      {/* Avatar upload */}
      <section className="flex items-center gap-4">
        <div className="relative">
          <Avatar name={profile?.full_name ?? "?"} avatarUrl={avatarUrl} size="lg" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          >
            <span className="text-white text-xs font-medium">
              {avatarUploading ? "..." : "変更"}
            </span>
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">プロフィール写真</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarUploading}
            className="mt-1 text-xs text-indigo-600 hover:underline disabled:opacity-50"
          >
            {avatarUploading ? "アップロード中..." : "画像を選択（JPG / PNG / WebP・2MB以内）"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </section>

      {/* Profile form */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Basic info</h2>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ユーザー名</label>
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
            {usernameOk && username !== profile?.username && (
              <p className="mt-1 text-xs text-green-600">使用できます</p>
            )}
            <p className="mt-1 text-xs text-slate-400">3〜20文字、英小文字・数字・アンダースコアのみ</p>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Home country</label>
              <input
                type="text"
                value={profileForm.home_country}
                onChange={(e) => setProfileForm((f) => ({ ...f, home_country: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Japan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Current location</label>
              <CityCombobox
                value={profileForm.current_location}
                onChange={(name) => setProfileForm((f) => ({ ...f, current_location: name }))}
                placeholder="Tokyo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Work location</label>
              <CityCombobox
                value={profileForm.work_location}
                onChange={(name) => setProfileForm((f) => ({ ...f, work_location: name }))}
                placeholder="Tokyo"
              />
            </div>
          </div>

          {/* Area（東京エリア） */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              よく出没するエリア（東京）
            </label>
            <div className="flex flex-wrap gap-2">
              {TOKYO_AREAS.map((a) => {
                const checked = selectedAreas.includes(a.name)
                return (
                  <label key={a.name} className={`flex items-center gap-1.5 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${checked ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setSelectedAreas((prev) =>
                          checked ? prev.filter((x) => x !== a.name) : [...prev, a.name]
                        )
                      }
                    />
                    {a.name}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Wants */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              今、求めていること
            </label>
            <div className="flex flex-wrap gap-2">
              {WANTS_OPTIONS.map((w) => {
                const checked = selectedWants.includes(w.value)
                return (
                  <label key={w.value} className={`flex items-center gap-1.5 cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${checked ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setSelectedWants((prev) =>
                          checked ? prev.filter((x) => x !== w.value) : [...prev, w.value]
                        )
                      }
                    />
                    {w.emoji} {w.label}
                  </label>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              興味・繋がりたい人
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                    e.preventDefault()
                    const newTag = tagInput.trim().replace(/,$/, "")
                    if (newTag && !tags.includes(newTag)) {
                      setTags((t) => [...t, newTag])
                    }
                    setTagInput("")
                  }
                }}
                placeholder="例: 留学生支援・北京・起業家（Enterで追加）"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((t) => t.filter((x) => x !== tag))}
                      className="hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SNS links */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">SNS・連絡先</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {([
                { key: "x", label: "X (Twitter)", placeholder: "username（@なし）" },
                { key: "instagram", label: "Instagram", placeholder: "username" },
                { key: "facebook", label: "Facebook", placeholder: "プロフィールURL or username" },
                { key: "wechat", label: "WeChat", placeholder: "WeChat ID" },
                { key: "line", label: "LINE", placeholder: "LINE ID" },
                { key: "kakao", label: "Kakao Talk", placeholder: "Kakao ID" },
                { key: "note", label: "note", placeholder: "username" },
                { key: "wantedly", label: "Wantedly", placeholder: "プロフィールURL" },
                { key: "youtrust", label: "YOUTRUST", placeholder: "プロフィールURL" },
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
              <UniversityCombobox
                required
                value={historyForm.university_name}
                onChange={(name, country) =>
                  setHistoryForm((f) => ({
                    ...f,
                    university_name: name,
                    ...(country ? { country } : {}),
                  }))
                }
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
