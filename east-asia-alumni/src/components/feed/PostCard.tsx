"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { PostWithAuthor, CommentWithAuthor } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"
import { MentionInput, renderWithMentions, extractMentionUsernames } from "@/components/ui/MentionInput"

type Props = {
  post: PostWithAuthor
  userId: string
}

function formatDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function PostCard({ post, userId }: Props) {
  const supabase = createClient()
  const [liked, setLiked] = useState(post.is_liked ?? false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.comments_count)
  const [commentInput, setCommentInput] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  async function toggleLike() {
    const next = !liked
    setLiked(next)
    setLikesCount((c) => c + (next ? 1 : -1))
    if (next) {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId })
    } else {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId)
    }
  }

  async function toggleComments() {
    setShowComments((v) => !v)
    if (!commentsLoaded) {
      const { data } = await supabase
        .from("comments")
        .select("*, author:profiles!comments_author_id_fkey(*)")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true })
      setComments((data ?? []) as CommentWithAuthor[])
      setCommentsLoaded(true)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentInput.trim() || commentSubmitting) return
    setCommentSubmitting(true)

    const { data } = await supabase
      .from("comments")
      .insert({ post_id: post.id, author_id: userId, content: commentInput.trim() })
      .select("*, author:profiles!comments_author_id_fkey(*)")
      .single()

    if (data) {
      setComments((prev) => [...prev, data as CommentWithAuthor])
      setCommentsCount((c) => c + 1)

      // ① 投稿主に comment 通知
      if (post.author_id !== userId) {
        await supabase.from("notifications").insert({
          user_id: post.author_id,
          actor_id: userId,
          type: "comment" as const,
          entity_id: post.id,
        })
      }

      // ② スレッド参加者に thread_reply 通知
      const { data: existingComments } = await supabase
        .from("comments").select("content").eq("post_id", post.id)
      const allContent = [post.content, ...(existingComments ?? []).map((c) => c.content)].join(" ")
      const threadUsernames = extractMentionUsernames(allContent)
      const newMentionUsernames = new Set(extractMentionUsernames(commentInput))
      if (threadUsernames.length > 0) {
        const { data: threadUsers } = await supabase
          .from("profiles").select("id, username")
          .in("username", threadUsernames)
          .neq("id", userId)
          .neq("id", post.author_id)
        const replyTargets = (threadUsers ?? []).filter((u) => !newMentionUsernames.has(u.username))
        if (replyTargets.length > 0) {
          await supabase.from("notifications").insert(
            replyTargets.map((u) => ({
              user_id: u.id,
              actor_id: userId,
              type: "thread_reply" as const,
              entity_id: post.id,
            }))
          )
        }
      }

      // ③ @メンション通知
      const usernames = extractMentionUsernames(commentInput)
      if (usernames.length > 0) {
        const { data: mentioned } = await supabase
          .from("profiles")
          .select("id")
          .in("username", usernames)
          .neq("id", userId)
        if (mentioned && mentioned.length > 0) {
          await supabase.from("notifications").insert(
            mentioned.map((p) => ({
              user_id: p.id,
              actor_id: userId,
              type: "mention" as const,
              entity_id: data.id,
            }))
          )
        }
      }

      setCommentInput("")
    }
    setCommentSubmitting(false)
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-3">
      {/* Author */}
      <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <Avatar name={post.author.full_name} avatarUrl={post.author.avatar_url} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{post.author.full_name}</p>
          <p className="text-xs text-slate-400">@{post.author.username} · {formatDate(post.created_at)}</p>
        </div>
      </Link>

      {/* Content */}
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
        {renderWithMentions(post.content)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? "text-red-500" : "text-slate-400 hover:text-red-400"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-1.5 text-sm transition-colors ${showComments ? "text-indigo-500" : "text-slate-400 hover:text-indigo-400"}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {commentsCount > 0 && <span>{commentsCount}</span>}
        </button>
      </div>

      {/* コメントセクション */}
      {showComments && (
        <div className="flex flex-col gap-3 pt-1 border-t border-slate-100">
          {comments.length > 0 && (
            <div className="flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Link href={`/profile/${c.author_id}`} className="shrink-0 hover:opacity-80 transition-opacity">
                    <Avatar name={c.author.full_name} avatarUrl={c.author.avatar_url} size="xs" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${c.author_id}`} className="hover:underline">
                      <span className="text-xs font-semibold text-slate-800">{c.author.full_name}</span>
                    </Link>
                    <span className="text-xs text-slate-400 ml-1.5">{formatDate(c.created_at)}</span>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {renderWithMentions(c.content)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex flex-col gap-2">
            <MentionInput
              value={commentInput}
              onChange={setCommentInput}
              placeholder="Add a comment... (@mention)"
              className="w-full resize-none text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed min-h-[48px]"
              disabled={commentSubmitting}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!commentInput.trim() || commentSubmitting}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  )
}
