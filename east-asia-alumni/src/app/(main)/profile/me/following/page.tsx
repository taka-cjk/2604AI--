import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"

export default async function MyFollowingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: rows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)

  const ids = (rows ?? []).map((r) => r.following_id)
  let people: Profile[] = []
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("*").in("id", ids)
    people = (data ?? []) as Profile[]
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link href="/profile/me" className="text-sm text-slate-500 hover:text-slate-700">← Back</Link>
        <h1 className="text-lg font-semibold text-slate-900">Following</h1>
        <span className="text-sm text-slate-400">{people.length}</span>
      </div>

      {people.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-12">Not following anyone yet</p>
      )}

      {people.map((p) => (
        <Link key={p.id} href={`/profile/${p.id}`}
          className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50 transition-colors">
          <Avatar name={p.full_name} avatarUrl={p.avatar_url} size="sm" />
          <div>
            <p className="text-sm font-medium text-slate-900">{p.full_name}</p>
            <p className="text-xs text-slate-500">@{p.username}</p>
            {p.bio && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.bio}</p>}
          </div>
        </Link>
      ))}
    </div>
  )
}
