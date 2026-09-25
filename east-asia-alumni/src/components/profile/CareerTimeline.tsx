import type { StudyAbroadHistory, WorkHistory } from "@/types/index"

type Entry =
  | { kind: "study"; data: StudyAbroadHistory }
  | { kind: "work";  data: WorkHistory }

type Props = {
  studies: StudyAbroadHistory[]
  works: WorkHistory[]
}

function formatMonth(s: string | null | undefined) {
  if (!s) return "Present"
  const d = new Date(s)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function CareerTimeline({ studies, works }: Props) {
  if (studies.length === 0 && works.length === 0) {
    return <p className="text-sm text-slate-400">No history yet.</p>
  }

  const entries: Entry[] = [
    ...studies.map(d => ({ kind: "study" as const, data: d })),
    ...works.map(d => ({ kind: "work" as const, data: d })),
  ].sort((a, b) => {
    const ta = a.data.start_date ? new Date(a.data.start_date).getTime() : 0
    const tb = b.data.start_date ? new Date(b.data.start_date).getTime() : 0
    return tb - ta
  })

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1
        const isStudy = entry.kind === "study"

        const dotColor   = isStudy ? "bg-indigo-400"   : "bg-emerald-400"
        const lineColor  = isStudy ? "bg-indigo-100"   : "bg-emerald-100"
        const leftBorder = isStudy ? "border-l-indigo-400" : "border-l-emerald-400"
        const tagClass   = isStudy
          ? "bg-indigo-50 text-indigo-600"
          : "bg-emerald-50 text-emerald-600"
        const tag = isStudy ? "Study" : "Work"

        let title: string
        let sub: string | null
        let dateRange: string

        if (entry.kind === "study") {
          const h = entry.data
          title = h.university_name
          sub = [h.program, h.country].filter(Boolean).join(" · ")
          dateRange = `${formatMonth(h.start_date)} – ${formatMonth(h.end_date)}`
        } else {
          const w = entry.data
          title = w.company_name
          sub = [w.role, w.location].filter(Boolean).join(" · ")
          dateRange = `${formatMonth(w.start_date)} – ${formatMonth(w.end_date)}`
        }

        const localName = entry.kind === "work" ? entry.data.company_name_local : null

        return (
          <div key={`${entry.kind}-${entry.data.id}`} className="flex gap-3">
            {/* 左列：ドット + 縦線 */}
            <div className="flex flex-col items-center pt-3.5">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
              {!isLast && <div className={`w-px flex-1 mt-1 mb-1 ${lineColor}`} />}
            </div>

            {/* 右列：カード */}
            <div className={`flex-1 mb-3 rounded-xl border border-slate-100 border-l-4 ${leftBorder} bg-white px-4 py-3 shadow-sm`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-900">
                      {title}
                      {localName && (
                        <span className="ml-1.5 text-xs font-normal text-slate-400">{localName}</span>
                      )}
                    </p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagClass}`}>
                      {tag}
                    </span>
                  </div>
                  {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
                </div>
                <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">{dateRange}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
