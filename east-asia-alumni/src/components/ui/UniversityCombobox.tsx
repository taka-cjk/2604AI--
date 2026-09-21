"use client"

import { useState, useRef, useEffect } from "react"
import {
  findUniversityByInput,
  searchUniversities,
  type UniversityEntry,
} from "@/data/universities"

type Props = {
  value: string
  onChange: (name: string, country?: string) => void
  placeholder?: string
  required?: boolean
  maxLength?: number
}

export function UniversityCombobox({
  value,
  onChange,
  placeholder = "Peking University",
  required,
  maxLength,
}: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [isOther, setIsOther] = useState(Boolean(value && !findUniversityByInput(value)))
  const containerRef = useRef<HTMLDivElement>(null)

  // close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const filtered: UniversityEntry[] = searchUniversities(query)

  // group by country
  const grouped: Record<string, UniversityEntry[]> = {}
  for (const u of filtered) {
    if (!grouped[u.country]) grouped[u.country] = []
    grouped[u.country].push(u)
  }

  function selectUniversity(u: UniversityEntry) {
    setQuery(u.name)
    setIsOther(false)
    setOpen(false)
    onChange(u.name, u.country)
  }

  function selectOther() {
    setIsOther(true)
    setQuery("")
    setOpen(false)
    onChange("")
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  if (isOther) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          required={required}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder="Enter university name"
          autoFocus
        />
        <button
          type="button"
          onClick={() => { setIsOther(false); setQuery(""); onChange("") }}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
        >
          ← list
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
        maxLength={maxLength}
        value={query}
        placeholder={placeholder}
        className={inputClass}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false)
        }}
        autoComplete="off"
      />

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {Object.entries(grouped).length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No results</div>
          ) : (
            Object.entries(grouped).map(([country, unis]) => (
              <div key={country}>
                <div className="sticky top-0 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {country}
                </div>
                {unis.map((u) => (
                  <button
                    key={u.name}
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700"
                    onMouseDown={(e) => { e.preventDefault(); selectUniversity(u) }}
                  >
                    <span>{u.name}</span>
                    {u.nameJa && <span className="ml-2 text-xs text-slate-400">{u.nameJa}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
          <div className="border-t border-slate-100">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-xs text-slate-500 hover:bg-slate-50"
              onMouseDown={(e) => { e.preventDefault(); selectOther() }}
            >
              その他（直接入力）
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
