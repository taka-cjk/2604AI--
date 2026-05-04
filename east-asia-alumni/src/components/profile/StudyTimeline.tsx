"use client"

import type { StudyAbroadHistory } from "@/types/index"

type Props = {
  histories: StudyAbroadHistory[]
}

const BAR_COLORS = [
  "bg-indigo-500",
  "bg-teal-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
]

function toDate(s: string | null | undefined): Date {
  return s ? new Date(s) : new Date()
}

// 重ならないように各エントリに行番号を割り当てる
function assignRows(items: StudyAbroadHistory[]): number[] {
  const rowEnds: Date[] = []
  const assignments: number[] = []

  for (const item of items) {
    const start = toDate(item.start_date)
    let placed = false
    for (let r = 0; r < rowEnds.length; r++) {
      if (start >= rowEnds[r]) {
        assignments.push(r)
        rowEnds[r] = toDate(item.end_date)
        placed = true
        break
      }
    }
    if (!placed) {
      assignments.push(rowEnds.length)
      rowEnds.push(toDate(item.end_date))
    }
  }
  return assignments
}

export function StudyTimeline({ histories }: Props) {
  if (histories.length === 0) {
    return <p className="text-sm text-slate-400">No study abroad history yet.</p>
  }

  // 開始日順にソート
  const sorted = [...histories].sort(
    (a, b) => toDate(a.start_date).getTime() - toDate(b.start_date).getTime()
  )

  // 全体の時間範囲
  const minDate = toDate(sorted[0].start_date)
  const maxDate = sorted.reduce(
    (max, h) => (toDate(h.end_date) > max ? toDate(h.end_date) : max),
    toDate(sorted[0].end_date)
  )

  // 見た目に少し余白を持たせる（前後3ヶ月）
  const rangeStart = new Date(minDate)
  rangeStart.setMonth(rangeStart.getMonth() - 2)
  const rangeEnd = new Date(maxDate)
  rangeEnd.setMonth(rangeEnd.getMonth() + 2)

  const totalMs = rangeEnd.getTime() - rangeStart.getTime()

  function pct(date: Date): number {
    return Math.max(0, Math.min(100, ((date.getTime() - rangeStart.getTime()) / totalMs) * 100))
  }

  // 年ラベルの生成（rangeStart〜rangeEnd の各年1月）
  const yearLabels: { label: string; pct: number }[] = []
  const y0 = rangeStart.getFullYear()
  const yN = rangeEnd.getFullYear() + 1
  for (let y = y0; y <= yN; y++) {
    const d = new Date(y, 0, 1)
    if (d >= rangeStart && d <= rangeEnd) {
      yearLabels.push({ label: String(y), pct: pct(d) })
    }
  }

  const rows = assignRows(sorted)
  const numRows = Math.max(...rows) + 1
  const ROW_H = 44 // px per row

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[480px]">
        {/* 年ラベル軸 */}
        <div className="relative h-6 mb-1" style={{ marginLeft: "0" }}>
          {yearLabels.map(({ label, pct: p }) => (
            <span
              key={label}
              className="absolute text-[11px] text-slate-400 -translate-x-1/2"
              style={{ left: `${p}%` }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* タイムライン本体 */}
        <div
          className="relative w-full rounded-lg bg-slate-50 border border-slate-200"
          style={{ height: `${numRows * ROW_H + 8}px` }}
        >
          {/* グリッド線（年ごと） */}
          {yearLabels.map(({ label, pct: p }) => (
            <div
              key={label}
              className="absolute top-0 bottom-0 border-l border-slate-200"
              style={{ left: `${p}%` }}
            />
          ))}

          {/* 「現在」ライン */}
          {pct(new Date()) > 0 && pct(new Date()) < 100 && (
            <div
              className="absolute top-0 bottom-0 border-l-2 border-pink-400 z-10"
              style={{ left: `${pct(new Date())}%` }}
            >
              <span className="absolute -top-5 -translate-x-1/2 text-[10px] text-pink-500 font-medium">
                Now
              </span>
            </div>
          )}

          {/* バー */}
          {sorted.map((h, i) => {
            const start = toDate(h.start_date)
            const end = toDate(h.end_date)
            const left = pct(start)
            const width = Math.max(pct(end) - left, 1.5)
            const row = rows[i]
            const color = BAR_COLORS[i % BAR_COLORS.length]

            const startLabel = h.start_date
              ? `${new Date(h.start_date).getFullYear()}.${String(new Date(h.start_date).getMonth() + 1).padStart(2, "0")}`
              : "?"
            const endLabel = h.end_date
              ? `${new Date(h.end_date).getFullYear()}.${String(new Date(h.end_date).getMonth() + 1).padStart(2, "0")}`
              : "Present"

            return (
              <div
                key={h.id}
                className="absolute group"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: `${4 + row * ROW_H}px`,
                  height: `${ROW_H - 8}px`,
                }}
                title={`${h.university_name} (${startLabel} – ${endLabel})`}
              >
                {/* バー本体 */}
                <div className={`h-full rounded-md ${color} flex items-center px-2 overflow-hidden cursor-default`}>
                  <span className="text-white text-xs font-medium truncate whitespace-nowrap">
                    {h.university_name}
                  </span>
                </div>

                {/* ホバーで詳細表示 */}
                <div className="absolute z-20 bottom-full mb-1 left-0 hidden group-hover:block">
                  <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <p className="font-semibold">{h.university_name}</p>
                    <p className="text-slate-300">{h.country}{h.program ? ` · ${h.program}` : ""}</p>
                    <p className="text-slate-400">{startLabel} – {endLabel}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 下軸 */}
        <div className="relative h-5 mt-1">
          {yearLabels.map(({ label, pct: p }) => (
            <span
              key={label}
              className="absolute text-[11px] text-slate-400 -translate-x-1/2"
              style={{ left: `${p}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
