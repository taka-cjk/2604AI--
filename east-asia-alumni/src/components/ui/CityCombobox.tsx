"use client"

import { useState, useRef, useEffect } from "react"
import { CITIES, type CityEntry } from "@/data/cities"

type Props = {
  value: string
  onChange: (name: string) => void
  placeholder?: string
  required?: boolean
}

export function CityCombobox({ value, onChange, placeholder = "Tokyo", required }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (!CITIES.find((c) => c.name === query)) setQuery(value)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [query, value])

  const filtered: CityEntry[] = query.trim()
    ? CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)
    : CITIES.slice(0, 20)

  const grouped: Record<string, CityEntry[]> = {}
  for (const c of filtered) {
    if (!grouped[c.country]) grouped[c.country] = []
    grouped[c.country].push(c)
  }

  function selectCity(c: CityEntry) {
    setQuery(c.name)
    setOpen(false)
    onChange(c.name)
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        required={required}
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
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {Object.entries(grouped).length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">No results</div>
          ) : (
            Object.entries(grouped).map(([country, cities]) => (
              <div key={country}>
                <div className="sticky top-0 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {country}
                </div>
                {cities.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700"
                    onMouseDown={(e) => { e.preventDefault(); selectCity(c) }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
