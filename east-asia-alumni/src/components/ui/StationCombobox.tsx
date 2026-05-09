"use client"

import { useState, useRef, useEffect } from "react"
import { STATIONS, STATION_MAP, type StationEntry } from "@/data/stations"

type Props = {
  value: string
  onChange: (name: string) => void
  placeholder?: string
}

export function StationCombobox({ value, onChange, placeholder = "渋谷 / Shibuya" }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (!STATION_MAP[query]) setQuery(value)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [query, value])

  const q = query.trim().toLowerCase()
  const filtered: StationEntry[] = q
    ? STATIONS.filter(
        (s) =>
          s.name.includes(query.trim()) ||
          s.kana.includes(q) ||
          s.label.toLowerCase().includes(q)
      ).slice(0, 30)
    : STATIONS.slice(0, 30)

  function select(s: StationEntry) {
    setQuery(s.name)
    setOpen(false)
    onChange(s.name)
  }

  function clear(e: React.MouseEvent) {
    e.preventDefault()
    setQuery("")
    setOpen(false)
    onChange("")
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        className={inputClass}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (!e.target.value) onChange("")
        }}
        onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          onMouseDown={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
          tabIndex={-1}
        >
          ×
        </button>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No stations found</div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.name}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700"
                onMouseDown={(e) => { e.preventDefault(); select(s) }}
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-slate-400 ml-2">{s.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
