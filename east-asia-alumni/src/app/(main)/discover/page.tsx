import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DiscoverClient } from "@/components/discover/DiscoverClient"
import type { Profile } from "@/types/index"

export type ProfileWithFollow = Profile & { is_following: boolean }

export default async function DiscoverPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const [{ data: profilesRaw }, { data: followsRaw }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id),
  ])

  const followingIds = new Set((followsRaw ?? []).map((f) => f.following_id))

  const profiles: ProfileWithFollow[] = (profilesRaw ?? []).map((p) => ({
    ...(p as Profile),
    is_following: followingIds.has(p.id),
  }))

  return <DiscoverClient profiles={profiles} userId={user.id} />
}
