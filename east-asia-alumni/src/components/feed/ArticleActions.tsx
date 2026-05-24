"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/upload"
import { MentionInput, extractMentionUsernames } from "@/components/ui/MentionInput"
import { ImageCropper } from "@/components/ui/ImageCropper"
import { Avatar } from "@/components/ui/Avatar"
import type { ArticleWithAuthors, Profile } from "@/types/index"

type Props = {
  article: ArticleWithAuthors
  userId: string
}

export function ArticleActions({ article, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const isOwner = article.author_id === userId

  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [loading, setLoading] = useState(false)

  // Edit form state
  const [title, setTitle] = useState(article.title)
  const [content, setContent] = useState(article.content)
  const [bannerPreview, setBannerPreview] = useState<string | null>(article.banner_url)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [coauthors, setCoauthors] = useState<Profile[]>(article.coauthors)
  const [coauthorQuery, setCoauthorQuery] = useState("")
  const [coauthorResults, setCoauthorResults] = useState<Profile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (!isOwner) return null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
  }

  function handleCropConfirm(file: File) {
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
    setCropSrc(null)
  }

  function handleCoauthorSearch(q: string) {
    setCoauthorQuery(q)
    clearTimeout(searchRef.current)
    if (q.length < 1) { setCoauthorResults([]); return }
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles").select("*")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq("id", userId).limit(6)
      const alreadyIds = new Set(coauthors.map((c) => c.id))
      setCoauthorResults((data ?? []).filter((p) => !alreadyIds.has(p.id)) as Profile[])
    }, 200)
  }

  async function handleSave(newStatus: "draft" | "published") {
    if (!title.trim() || !content.trim()) return
    setLoading(true)
    try {
      let banner_url = bannerPreview
      if (bannerFile) {
        banner_url = await uploadImage(supabase, "article-images", userId, bannerFile)
      }

      await supabase
        .from("articles")
        .update({ title: title.trim(), content: content.trim(), banner_url, status: newStatus })
        .eq("id", article.id)

      // coauthors を差し替え
      await supabase.from("article_coauthors").delete().eq("article_id", article.id)
      if (coauthors.length > 0) {
        await supabase.from("article_coauthors").insert(
          coauthors.map((c) => ({ article_id: article.id, user_id: c.id }))
        )
      }

      // @mention 通知（新規追加分のみ — 差分は取らず記事全体で再送はしない。簡易実装）
      const usernames = extractMentionUsernames(content)
      if (usernames.length > 0) {
        const { data: mentioned } = await supabase
          .from("profiles").select("id").in("username", usernames).neq("id", userId)
        if (mentioned && mentioned.length > 0) {
          await supabase.from("notifications").insert(
            mentioned.map((p: { id: string }) => ({
              user_id: p.id, actor_id: userId, type: "mention" as const, entity_id: article.id,
            }))
          )
        }
      }

      setEditing(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    await supabase.from("articles").delete().eq("id", article.id)
    router.push("/feed")
  }

  async function handlePublish() {
    setLoading(true)
    await supabase.from("articles").update({ status: "published" }).eq("id", article.id)
    router.refresh()
    setLoading(false)
  }

  if (!editing) {
    return (
      <>
        {/* Owner actions bar */}
        <div className="flex items-center gap-2 pt-2">
          {article.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="px-4 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Publish
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Edit
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Delete this article?</span>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-1.5 text-sm rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </>
    )
  }

  // ── Edit form ──────────────────────────────────────────────
  return (
    <>
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
        />
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Edit Article</span>
          <button type="button" onClick={() => setEditing(false)} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          disabled={loading}
          className="w-full text-base font-medium text-slate-900 outline-none border-b border-slate-200 pb-2 bg-transparent focus:border-indigo-400 transition-colors"
        />

        {/* Banner */}
        <div>
          {bannerPreview ? (
            <div className="relative rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerPreview} alt="Banner" className="w-full aspect-video object-cover" />
              <button
                type="button"
                onClick={() => { setBannerPreview(null); setBannerFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors"
            >
              Add banner image
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </div>

        <MentionInput
          value={content}
          onChange={(v) => setContent(v.slice(0, 50000))}
          placeholder="Article content..."
          className="w-full resize-none text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed min-h-[160px] bg-transparent"
          disabled={loading}
        />

        {/* Co-authors */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-500">Co-authors</label>
          {coauthors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {coauthors.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full pl-1.5 pr-2 py-0.5">
                  <Avatar name={c.full_name} avatarUrl={c.avatar_url} size="xs" />
                  <span className="text-xs text-slate-700">{c.full_name}</span>
                  <button type="button" onClick={() => setCoauthors((prev) => prev.filter((x) => x.id !== c.id))} className="text-slate-400 hover:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={coauthorQuery}
              onChange={(e) => handleCoauthorSearch(e.target.value)}
              onBlur={() => setTimeout(() => setCoauthorResults([]), 150)}
              placeholder="Search by name or @username"
              disabled={loading}
              className="w-full text-sm text-slate-800 placeholder-slate-400 outline-none border border-slate-200 rounded-lg px-3 py-2 bg-white focus:border-indigo-400 transition-colors"
            />
            {coauthorResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-10">
                {coauthorResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setCoauthors((prev) => [...prev, p])
                      setCoauthorQuery("")
                      setCoauthorResults([])
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
                  >
                    <Avatar name={p.full_name} avatarUrl={p.avatar_url} size="xs" />
                    <span className="font-medium text-slate-800">{p.full_name}</span>
                    <span className="text-slate-400 text-xs">@{p.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={loading || !title.trim() || !content.trim()}
            onClick={() => handleSave("draft")}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={loading || !title.trim() || !content.trim()}
            onClick={() => handleSave("published")}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>
    </>
  )
}
