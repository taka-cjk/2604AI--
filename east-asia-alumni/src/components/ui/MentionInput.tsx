"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types/index"
export { renderWithMentions, extractMentionUsernames } from "@/lib/mentions"

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MentionInput({ value, onChange, placeholder, className, disabled }: Props) {
  const supabase = createClient()
  const [results, setResults] = useState<Profile[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function getMentionQuery(val: string, cursorPos: number): string | null {
    const textBefore = val.slice(0, cursorPos)
    const match = textBefore.match(/@(\w*)$/)
    if (!match) return null
    return match[1]
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    onChange(val)

    const cursorPos = e.target.selectionStart ?? val.length
    const query = getMentionQuery(val, cursorPos)

    if (query !== null && query.length >= 1) {
      clearTimeout(searchTimeout.current)
      searchTimeout.current = setTimeout(async () => {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(6)
        setResults((data ?? []) as Profile[])
        setShowDropdown(true)
      }, 200)
    } else {
      setShowDropdown(false)
      setResults([])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      setShowDropdown(false)
      setResults([])
    }
  }

  function selectMention(profile: Profile) {
    const cursorPos = inputRef.current?.selectionStart ?? value.length
    const before = value.slice(0, cursorPos)
    const after = value.slice(cursorPos)
    const newBefore = before.replace(/@\w*$/, `@${profile.username} `)
    onChange(newBefore + after)
    setShowDropdown(false)
    setResults([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute bottom-full mb-1 left-0 w-64 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-20">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); selectMention(r) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-800">{r.full_name}</span>
                <span className="text-slate-400 text-xs ml-1.5">@{r.username}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

