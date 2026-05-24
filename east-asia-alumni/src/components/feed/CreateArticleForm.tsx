"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { uploadImage } from "@/lib/upload"
import { MentionInput, extractMentionUsernames } from "@/components/ui/MentionInput"
import { ImageCropper } from "@/components/ui/ImageCropper"
import { Avatar } from "@/components/ui/Avatar"
import type { ArticleWithAuthors, Profile } from "@/types/index"

type Props = {
  userId: string
  onAdd: (article: ArticleWithAuthors) => void
  onClose: () => void
}

export function CreateArticleForm({ userId, onAdd, onClose }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [coauthors, setCoauthors] = useState<Profile[]>([])
  const [coauthorQuery, setCoauthorQuery] = useState("")
  const [coauthorResults, setCoauthorResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
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
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
        .neq("id", userId)
        .limit(6)
      const alreadyIds = new Set(coauthors.map((c) => c.id))
      setCoauthorResults((data ?? []).filter((p) => !alreadyIds.has(p.id)) as Profile[])
    }, 200)
  }

  function addCoauthor(p: Profile) {
    setCoauthors((prev) => [...prev, p])
    setCoauthorQuery("")
    setCoauthorResults([])
  }

  function removeCoauthor(id: string) {
    setCoauthors((prev) => prev.filter((c) => c.id !== id))
  }

  async function submit(status: "draft" | "published") {
    if (!title.trim() || !content.trim()) return
    setError(null)
    setLoading(true)

    try {
      let banner_url: string | null = null
      if (bannerFile) {
        banner_url = await uploadImage(supabase, "article-images", userId, bannerFile)
      }

      const { data: article, error: articleError } = await supabase
        .from("articles")
        .insert({ author_id: userId, title: title.trim(), content: content.trim(), banner_url, status })
        .select()
        .single()

      if (articleError || !article) {
        setError(articleError?.message ?? "Failed to save article")
        setLoading(false)
        return
      }

      // co-authors
      if (coauthors.length > 0) {
        await supabase.from("article_coauthors").insert(
          coauthors.map((c) => ({ article_id: article.id, user_id: c.id }))
        )
      }

      // @mention notifications
      const usernames = extractMentionUsernames(content)
      if (usernames.length > 0) {
        const { data: mentioned } = await supabase
          .from("profiles").select("id").in("username", usernames).neq("id", userId)
        if (mentioned && mentioned.length > 0) {
          await supabase.from("notifications").insert(
            mentioned.map((p: { id: string }) => ({
              user_id: p.id,
              actor_id: userId,
              type: "mention" as const,
              entity_id: article.id,
            }))
          )
        }
      }

      const { data: authorProfile } = await supabase
        .from("profiles").select("*").eq("id", userId).single<Profile>()

      if (authorProfile) {
        onAdd({
          ...article,
          status: article.status as "draft" | "published",
          author: authorProfile,
          coauthors,
        })
      }

      setTitle("")
      setContent("")
      setBannerPreview(null)
      setBannerFile(null)
      setCoauthors([])
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
        />
      )}

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Write Article</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 200))}
          placeholder="Article title"
          disabled={loading}
          className="w-full text-base font-medium text-slate-900 placeholder-slate-400 outline-none border-b border-slate-200 pb-2 focus:border-indigo-400 transition-colors"
        />

        {/* Banner image */}
        <div>
          {bannerPreview ? (
            <div className="relative rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerPreview} alt="Banner preview" className="w-full aspect-video object-cover" />
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
              className="w-full border-2 border-dashed border-slate-200 rounded-lg py-4 text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M13.5 12h.008v.008H13.5V12zm4.5 0a6.75 6.75 0 10-13.5 0 6.75 6.75 0 0013.5 0z" />
              </svg>
              Add banner image (optional)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Content */}
        <MentionInput
          value={content}
          onChange={(v) => setContent(v.slice(0, 50000))}
          placeholder="Write your article... (@mention users)"
          className="w-full resize-none text-sm text-slate-800 placeholder-slate-400 outline-none leading-relaxed min-h-[200px]"
          disabled={loading}
        />

        {/* Co-authors */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-500">Co-authors (optional)</label>
          {coauthors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {coauthors.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-slate-100 rounded-full pl-1.5 pr-2 py-0.5">
                  <Avatar name={c.full_name} avatarUrl={c.avatar_url} size="xs" />
                  <span className="text-xs text-slate-700">{c.full_name}</span>
                  <button type="button" onClick={() => removeCoauthor(c.id)} className="text-slate-400 hover:text-red-400 transition-colors">
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
              className="w-full text-sm text-slate-800 placeholder-slate-400 outline-none border border-slate-200 rounded-lg px-3 py-2 focus:border-indigo-400 transition-colors"
            />
            {coauthorResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-10">
                {coauthorResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addCoauthor(p) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
                  >
                    <Avatar name={p.full_name} avatarUrl={p.avatar_url} size="xs" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-800">{p.full_name}</span>
                      <span className="text-slate-400 text-xs ml-1.5">@{p.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={loading || !title.trim() || !content.trim()}
            onClick={() => submit("draft")}
            className="px-4 py-2 text-sm rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-colors"
          >
            {loading ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            disabled={loading || !title.trim() || !content.trim()}
            onClick={() => submit("published")}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </>
  )
}
