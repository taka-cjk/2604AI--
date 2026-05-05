"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from("profiles").select("username, full_name").eq("id", user.id).single()
      if (profile) {
        setUsername(profile.username ?? "")
        setFullName(profile.full_name ?? "")
      }
    }
    load()
  }, [])

  async function checkUsername(value: string) {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setUsername(clean)
    if (clean.length < 3) { setUsernameError("At least 3 characters"); return }
    setChecking(true)
    const { data } = await supabase
      .from("profiles").select("id").eq("username", clean).neq("id", userId ?? "").maybeSingle()
    setChecking(false)
    setUsernameError(data ? "This username is already taken" : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (usernameError || !userId) return
    setLoading(true)
    await supabase.from("profiles").update({ username, full_name: fullName }).eq("id", userId)
    router.push("/feed")
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Set up your profile</h2>
      <p className="text-sm text-slate-500 mb-6">You can change these anytime in your profile settings.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Taro Yamada"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <div className="flex items-center rounded-lg border border-slate-300 px-3 py-2 gap-1 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <span className="text-slate-400 text-sm select-none">@</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => checkUsername(e.target.value)}
              placeholder="your_username"
              className="flex-1 text-sm outline-none"
            />
            {checking && <span className="text-xs text-slate-400">Checking…</span>}
          </div>
          {usernameError && (
            <p className="mt-1 text-xs text-red-500">{usernameError}</p>
          )}
          <p className="mt-1 text-xs text-slate-400">Lowercase letters, numbers, and underscores only.</p>
        </div>

        <button
          type="submit"
          disabled={loading || !!usernameError || checking || username.length < 3}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Get started →"}
        </button>
      </form>
    </div>
  )
}
