"use client"

import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

type CompanySuggestion = {
  company_name: string
  company_name_local: string | null
}

type Props = {
  value: string
  valueLocal: string
  onChange: (name: string, nameLocal: string) => void
  required?: boolean
}

export function CompanyCombobox({ value, valueLocal, onChange, required }: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleInput(q: string) {
    setQuery(q)
    onChange(q, valueLocal)
    clearTimeout(searchTimeout.current)
    if (!q.trim()) { setSuggestions([]); setOpen(false); return }
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from("work_histories")
        .select("company_name, company_name_local")
        .or(`company_name.ilike.%${q}%,company_name_local.ilike.%${q}%`)
        .limit(20)
      // deduplicate by company_name
      const seen = new Set<string>()
      const unique: CompanySuggestion[] = []
      for (const row of data ?? []) {
        if (!seen.has(row.company_name)) {
          seen.add(row.company_name)
          unique.push(row)
        }
      }
      setSuggestions(unique)
      setOpen(unique.length > 0)
    }, 250)
  }

  function select(s: CompanySuggestion) {
    setQuery(s.company_name)
    onChange(s.company_name, s.company_name_local ?? "")
    setOpen(false)
    setSuggestions([])
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        value={query}
        placeholder="Google, 字节跳动, ..."
        className={inputClass}
        autoComplete="off"
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s.company_name}
              type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700"
              onMouseDown={(e) => { e.preventDefault(); select(s) }}
            >
              <span>{s.company_name}</span>
              {s.company_name_local && (
                <span className="ml-2 text-xs text-slate-400">{s.company_name_local}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
