"use client"

import { useState } from "react"
import type { StudyAbroadHistory, WorkHistory } from "@/types/index"

type Props = {
  studies: StudyAbroadHistory[]
  works: WorkHistory[]
}

type Period = "1y" | "6m" | "3m"

const CELL_PX = 52
const BAR_H   = 28
const ROW_H   = 52
const PAD_PX  = 24

function toDate(s: string | null | undefined): Date {
  return s ? new Date(s) : new Date()
}

function fmtMonth(s: string | null | undefined): string {
  if (!s) return "Present"
  const d = new Date(s)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`
}

function calcDuration(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return ""
  const s = new Date(start)
  const e = end ? new Date(end) : new Date()
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m}m`
  if (m === 0) return `${y}y`
  return `${y}y ${m}m`
}

function axisLabel(d: Date): string {
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`
}

function unitMonths(p: Period): number {
  return p === "1y" ? 12 : p === "6m" ? 6 : 3
}

function GradCapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18V17l7 4 7-4v-3.82L12 17l-7-3.82z" />
    </svg>
  )
}

const GANTT_INITIAL_ROWS = 3
const LIST_INITIAL_ROWS  = 2

function ChevronIcon({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
      <path strokeLinecap="round" strokeLinejoin="round" d={up ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
    </svg>
  )
}

export function CareerTimeline({ studies, works }: Props) {
  const [period, setPeriod]           = useState<Period>("6m")
  const [ganttExpanded, setGanttExpanded] = useState(false)
  const [listExpanded,  setListExpanded]  = useState(false)

  if (studies.length === 0 && works.length === 0) {
    return <p className="text-sm text-slate-400">No history yet.</p>
  }

  const now = new Date()

  // 1機関1行、終了日が新しい順
  const rows = [
    ...studies.map(h => ({
      id: h.id,
      kind: "study" as const,
      label: h.university_name,
      startD: toDate(h.start_date),
      endD: toDate(h.end_date),
      originalEnd: h.end_date,
      sub: [h.program, h.country].filter(Boolean).join(" · "),
      localName: null as string | null,
    })),
    ...works.map(w => ({
      id: w.id,
      kind: "work" as const,
      label: w.company_name,
      startD: toDate(w.start_date),
      endD: toDate(w.end_date),
      originalEnd: w.end_date,
      sub: [w.role, w.location].filter(Boolean).join(" · "),
      localName: w.company_name_local,
    })),
  ].sort((a, b) => b.endD.getTime() - a.endD.getTime())

  // 時間範囲
  const rangeEnd = new Date(now)
  rangeEnd.setMonth(rangeEnd.getMonth() + 1)
  const oldest = rows.reduce((mn, r) => (r.startD < mn ? r.startD : mn), rows[0].startD)
  const rangeStart = new Date(oldest)
  rangeStart.setMonth(rangeStart.getMonth() - 2)
  const totalMs = rangeEnd.getTime() - rangeStart.getTime()
  const totalMonths =
    (rangeEnd.getFullYear() - rangeStart.getFullYear()) * 12 +
    (rangeEnd.getMonth() - rangeStart.getMonth())

  const u = unitMonths(period)
  const innerW = Math.ceil(totalMonths / u) * CELL_PX + PAD_PX * 2

  // 右→左軸: newer=左(小さいx), older=右(大きいx)
  function xOf(d: Date): number {
    return ((rangeEnd.getTime() - d.getTime()) / totalMs) * (innerW - PAD_PX * 2) + PAD_PX
  }

  // グリッド線の日付
  const gridDates: Date[] = []
  {
    const sy = rangeStart.getFullYear()
    const sm = Math.floor(rangeStart.getMonth() / u) * u
    let d = new Date(sy, sm, 1)
    while (d <= rangeEnd) {
      if (d >= rangeStart) gridDates.push(new Date(d))
      d = new Date(d.getFullYear(), d.getMonth() + u, 1)
    }
  }

  const nowX = xOf(now)

  const visibleGanttRows  = ganttExpanded ? rows : rows.slice(0, GANTT_INITIAL_ROWS)
  const showGanttToggle   = rows.length > GANTT_INITIAL_ROWS
  const visibleListRows   = listExpanded  ? rows : rows.slice(0, LIST_INITIAL_ROWS)
  const showListToggle    = rows.length > LIST_INITIAL_ROWS

  const chartH = visibleGanttRows.length * ROW_H + 8

  const Axis = () => (
    <div className="relative h-5" style={{ minWidth: innerW }}>
      {gridDates.map((d, i) => (
        <span
          key={i}
          className="absolute text-[10px] text-slate-400 -translate-x-1/2 font-mono"
          style={{ left: xOf(d) }}
        >
          {axisLabel(d)}
        </span>
      ))}
      <span
        className="absolute text-[10px] text-rose-500 font-bold -translate-x-1/2"
        style={{ left: nowX }}
      >
        Now
      </span>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">

      {/* ── ガントチャート ── */}
      <div>
        {/* 期間ボタン */}
        <div className="flex gap-1.5 mb-3">
          {(["1y", "6m", "3m"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-0.5 text-xs font-semibold border transition-colors ${
                period === p
                  ? "bg-teal-500 border-teal-500 text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"
              }`}
            >
              {p === "1y" ? "1yr" : p === "6m" ? "6mo" : "3mo"}
            </button>
          ))}
        </div>

        {/* スクロール可能なガント */}
        <div className="overflow-x-auto">
          <div style={{ width: innerW }}>
            <Axis />

            {/* チャート本体 */}
            <div
              className="relative border border-slate-200 rounded-xl bg-white"
              style={{ height: chartH, minWidth: innerW }}
            >
              {/* グリッド線 */}
              {gridDates.map((d, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-l border-slate-100"
                  style={{ left: xOf(d) }}
                />
              ))}
              {/* Nowライン */}
              <div
                className="absolute top-0 bottom-0 border-l-2 border-rose-400 z-10"
                style={{ left: nowX }}
              />

              {/* バー */}
              {visibleGanttRows.map((row, i) => {
                const endX  = xOf(row.endD)
                const startX = xOf(row.startD)
                const w = Math.max(startX - endX, 3)
                const top = 4 + i * ROW_H
                const isWork = row.kind === "work"
                const dur = calcDuration(row.startD.toISOString(), row.originalEnd)

                return (
                  <div
                    key={row.id}
                    className="absolute group"
                    style={{ left: endX, top, width: w, height: BAR_H }}
                  >
                    <div
                      className={`h-full rounded-md flex items-center px-2 overflow-visible ${
                        isWork ? "bg-teal-100" : "bg-slate-200"
                      }`}
                    >
                      <span className={`text-xs mr-1 flex-shrink-0 ${isWork ? "text-teal-700" : "text-slate-500"}`}>
                        {isWork ? "◎" : "○"}
                      </span>
                      <span className={`text-[13px] font-bold whitespace-nowrap ${
                        isWork ? "text-teal-800" : "text-slate-800"
                      }`}>
                        {row.label}
                      </span>
                    </div>
                    {dur && (
                      <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap pl-1">{dur}</p>
                    )}
                    {/* ホバートルーチップ */}
                    <div className="absolute z-20 bottom-full mb-1 left-0 hidden group-hover:block pointer-events-none">
                      <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                        <p className="font-semibold">{row.label}</p>
                        <p className="text-slate-400">
                          {fmtMonth(row.startD.toISOString())} – {fmtMonth(row.originalEnd)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 下軸 */}
            <div className="relative h-5 mt-0.5" style={{ minWidth: innerW }}>
              {gridDates.map((d, i) => (
                <span
                  key={i}
                  className="absolute text-[10px] text-slate-400 -translate-x-1/2 font-mono"
                  style={{ left: xOf(d) }}
                >
                  {axisLabel(d)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ガント 展開トグル */}
        {showGanttToggle && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() => setGanttExpanded(e => !e)}
              className="flex items-center gap-1 rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
            >
              {ganttExpanded ? "Show less" : "Show more"}
              <ChevronIcon up={ganttExpanded} />
            </button>
          </div>
        )}

        {/* 凡例 */}
        <div className="flex gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-400" />
            <span className="text-xs text-slate-500">Work</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
            <span className="text-xs text-slate-500">Study</span>
          </div>
        </div>
      </div>

      {/* ── YOUTRUST風縦リスト ── */}
      <div className="flex flex-col">
        {visibleListRows.map((row, i) => {
          const isLast = i === visibleListRows.length - 1
          const dur = calcDuration(row.startD.toISOString(), row.originalEnd)
          const dateStr = `${fmtMonth(row.startD.toISOString())} – ${fmtMonth(row.originalEnd)}${dur ? ` (${dur})` : ""}`

          return (
            <div key={row.id} className="flex gap-3">
              {/* 左列: アイコン + 縦線 */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {row.kind === "work" ? (
                    <span className="text-base font-bold text-slate-500">
                      {row.label.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <GradCapIcon />
                  )}
                </div>
                {!isLast && <div className="w-px flex-1 bg-slate-100 mt-1 mb-1" />}
              </div>

              {/* 右列: テキスト */}
              <div className="flex-1 pb-5 pt-1">
                <p className="text-[15px] font-bold text-slate-900 leading-snug">
                  {row.label}
                  {row.localName && (
                    <span className="ml-2 text-sm font-normal text-slate-400">{row.localName}</span>
                  )}
                </p>
                {row.sub && <p className="text-sm text-slate-500 mt-0.5">{row.sub}</p>}
                <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* リスト 展開トグル */}
      {showListToggle && (
        <div className="flex justify-center mt-1">
          <button
            onClick={() => setListExpanded(e => !e)}
            className="flex items-center gap-1 rounded-full border border-slate-300 px-4 py-1 text-xs font-semibold text-slate-500 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
          >
            {listExpanded ? "Show less" : `Show ${rows.length - LIST_INITIAL_ROWS} more`}
            <ChevronIcon up={listExpanded} />
          </button>
        </div>
      )}
    </div>
  )
}
