import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile, StudyAbroadHistory } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { StudyTimeline } from "@/components/profile/StudyTimeline"

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
    .order("start_date", { ascending: true })

  const typedHistories = (histories ?? []) as StudyAbroadHistory[]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.full_name} avatarUrl={profile.avatar_url} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{profile.full_name}</h1>
            <p className="text-sm text-slate-500">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-sm text-slate-700">{profile.bio}</p>}
          </div>
        </div>
        <Link
          href="/profile/edit"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Edit profile
        </Link>
      </div>

      {/* Study abroad timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">留学歴</h2>
          <Link href="/profile/edit#study" className="text-xs text-indigo-600 hover:underline">
            + Add
          </Link>
        </div>

        <StudyTimeline histories={typedHistories} />
      </div>
    </div>
  )
}
