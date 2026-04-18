"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { PostWithAuthor, Profile } from "@/types/index"

type Props = {
  userId: string
  onAdd: (post: PostWithAuthor) => void
}

export function CreatePostForm({ userId, onAdd }: Props) {
  const supabase = createClient()
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MAX = 1000
  const remaining = MAX - content.length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)
    setLoading(true)

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({ author_id: userId, content: content.trim() })
      .select()
      .single()

    if (postError || !post) {
      setError(postError?.message ?? "投稿に失敗しました")
      setLoading(false)
      return
    }

    const { data: author } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>()

    if (author) {
      onAdd({
        ...post,
        author,
        likes_count: 0,
        comments_count: 0,
        is_liked: false,
      })
    }

    setContent("")
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-3"
    >
      <textarea
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX}
        placeholder="今どうしてる？留学の思い出、近況をシェアしよう"
        className="w-full resize-none text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed"
      />

      <div className="flex items-center justify-between">
        <span className={`text-xs ${remaining < 50 ? "text-red-400" : "text-slate-400"}`}>
          {remaining}
        </span>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </form>
  )
}
