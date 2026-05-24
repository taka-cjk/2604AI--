import type { ArticleWithAuthors } from "@/types/index"
import { ArticleCard } from "./ArticleCard"

type Props = {
  articles: ArticleWithAuthors[]
}

export function ArticleList({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <p className="text-sm text-slate-400 text-center py-8">
        No articles yet. Be the first to write one!
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {articles.map((a) => (
        <ArticleCard key={a.id} article={a} />
      ))}
    </div>
  )
}
