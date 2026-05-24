import React from "react"

export function renderWithMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) =>
    /^@\w+$/.test(part)
      ? <span key={i} className="text-indigo-600 font-medium">{part}</span>
      : part
  )
}

export function extractMentionUsernames(text: string): string[] {
  const matches = text.match(/@(\w+)/g) ?? []
  return [...new Set(matches.map((m) => m.slice(1)))]
}
