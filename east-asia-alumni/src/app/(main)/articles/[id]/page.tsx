import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Avatar } from "@/components/ui/Avatar"
import { renderWithMentions } from "@/lib/mentions"
import { ArticleActions } from "@/components/feed/ArticleActions"
import type { Profile } from "@/types/index"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  })
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: raw } = await supabase
    .from("articles")
    .select("*, author:profiles!articles_author_id_fkey(*), coauthors:article_coauthors(user:profiles(*))")
    .eq("id", id)
    .single()

  if (!raw) notFound()

  // Draft は本人のみ閲覧可
  if (raw.status === "draft" && raw.author_id !== user.id) notFound()

  const article = {
    ...raw,
    status: raw.status as "draft" | "published",
    author: raw.author as Profile,
    coauthors: (raw.coauthors ?? []).map((c: any) => c.user as Profile).filter(Boolean),
  }

  const allAuthors = [article.author, ...article.coauthors]

  return (
    <div className="flex flex-col gap-0">
      {/* Banner */}
      {article.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.banner_url}
          alt={article.title}
          className="w-full aspect-video object-cover rounded-xl"
        />
      )}

      <div className="flex flex-col gap-4 pt-5">
        {/* Draft badge */}
        {article.status === "draft" && (
          <span className="self-start text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
            Draft — only visible to you
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 leading-snug">
          {article.title}
        </h1>

        {/* Authors & date */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">
            {allAuthors.length > 1 ? "Authors:" : "Author:"}
          </span>
          {allAuthors.map((a, i) => (
            <Link
              key={a.id}
              href={`/profile/${a.id}`}
              className="flex items-center gap-1.5 hover:underline"
            >
              <Avatar name={a.full_name} avatarUrl={a.avatar_url} size="xs" />
              <span className="text-sm font-medium text-slate-700">{a.full_name}</span>
              {i < allAuthors.length - 1 && (
                <span className="text-xs text-slate-300 mr-0.5">,</span>
              )}
            </Link>
          ))}
          <span className="text-xs text-slate-400 ml-1">· {formatDate(article.created_at)}</span>
        </div>

        <hr className="border-slate-200" />

        {/* Content */}
        <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
          {renderWithMentions(article.content)}
        </p>

        {/* Owner actions: Edit / Delete / Publish */}
        <ArticleActions article={article} userId={user.id} />

        {/* Back link */}
        <div className="pt-4">
          <Link
            href="/feed"
            className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Feed
          </Link>
        </div>
      </div>
    </div>
  )
}
