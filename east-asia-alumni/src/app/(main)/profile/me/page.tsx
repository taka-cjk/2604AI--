import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile, StudyAbroadHistory } from "@/types/index"

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
    .order("start_date", { ascending: false })

  const typedHistories = (histories ?? []) as StudyAbroadHistory[]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{profile.full_name}</h1>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm text-slate-700">{profile.bio}</p>}
        </div>
        <Link
          href="/profile/edit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Edit profile
        </Link>
      </div>

      {/* Study abroad */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Study abroad history</h2>
          <Link
            href="/profile/edit#study"
            className="text-xs text-indigo-600 hover:underline"
          >
            + Add
          </Link>
        </div>

        {typedHistories.length === 0 ? (
          <p className="text-sm text-slate-400">No history added yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {typedHistories.map((h) => (
              <li key={h.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{h.university_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {h.country}{h.program ? ` · ${h.program}` : ""}
                </p>
                {(h.start_date || h.end_date) && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {h.start_date ?? "?"} – {h.end_date ?? "present"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
