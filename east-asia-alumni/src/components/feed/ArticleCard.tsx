"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { ArticleWithAuthors } from "@/types/index"
import { Avatar } from "@/components/ui/Avatar"

type Props = {
  article: ArticleWithAuthors
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

export function ArticleCard({ article }: Props) {
  const router = useRouter()
  const allAuthors = [article.author, ...article.coauthors]

  return (
    <article
      onClick={() => router.push(`/articles/${article.id}`)}
      className="rounded-xl border border-slate-200 border-l-4 border-l-violet-400 bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Banner */}
      {article.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.banner_url}
          alt={article.title}
          className="w-full aspect-video object-cover"
        />
      )}

      <div className="px-5 py-4 flex flex-col gap-2">
        {/* Draft badge */}
        {article.status === "draft" && (
          <span className="self-start text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
            Draft
          </span>
        )}

        {/* Title */}
        <h2 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
          {article.title}
        </h2>

        {/* Authors */}
        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-slate-400">
            {allAuthors.length > 1 ? "Authors:" : "Author:"}
          </span>
          {allAuthors.map((a, i) => (
            <Link
              key={a.id}
              href={`/profile/${a.id}`}
              className="flex items-center gap-1 hover:underline"
            >
              <Avatar name={a.full_name} avatarUrl={a.avatar_url} size="xs" />
              <span className="text-xs font-medium text-slate-700">{a.full_name}</span>
              {i < allAuthors.length - 1 && (
                <span className="text-xs text-slate-300 mr-0.5">,</span>
              )}
            </Link>
          ))}
          <span className="text-xs text-slate-400 ml-1">· {formatDate(article.created_at)}</span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
          {article.content}
        </p>
      </div>
    </article>
  )
}
