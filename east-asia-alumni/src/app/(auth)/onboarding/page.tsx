"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Session expired. Please sign in again.")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      username,
      full_name: fullName || (user.user_metadata?.full_name ?? ""),
      tags: [],
    })

    if (error) {
      if (error.code === "23505") {
        setError("That username is already taken.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push("/feed")
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Set up your profile</h2>
      <p className="text-sm text-slate-500 mb-6">Choose a username to get started.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username
          </label>
          <div className="flex items-center rounded-lg border border-slate-300 px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
            <span className="text-slate-400 text-sm mr-1">@</span>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              className="flex-1 text-sm outline-none bg-transparent"
              placeholder="your_username"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Lowercase letters, numbers, underscores only.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Display name
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Taro Yamada"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Get started"}
        </button>
      </form>
    </div>
  )
}
