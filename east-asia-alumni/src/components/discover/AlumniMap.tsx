"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"
import type { Profile } from "@/types/index"
import { CITY_MAP } from "@/data/cities"
import { AREA_MAP } from "@/data/areas"

type Props = {
  profiles: Profile[]
}

type HeatPoint = [number, number, number]

function resolvePoints(profiles: Profile[]): HeatPoint[] {
  const points: HeatPoint[] = []
  for (const p of profiles) {
    const areas = p.area?.filter(Boolean) ?? []
    if (areas.length > 0) {
      for (const areaName of areas) {
        const entry = AREA_MAP[areaName]
        if (entry) points.push([entry.lat, entry.lng, 1])
      }
    } else if (p.current_location) {
      const city = CITY_MAP[p.current_location]
      if (city) points.push([city.lat, city.lng, 0.7])
    }
  }
  return points
}

export default function AlumniMap({ profiles }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function init() {
      const L = (await import("leaflet")).default
      await import("leaflet.heat")

      const map = L.map(mapRef.current!, {
        center: [35.5, 127],
        zoom: 4,
        scrollWheelZoom: true,
      })
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map)

      const points = resolvePoints(profiles)
      if (points.length > 0) {
        // @ts-expect-error leaflet.heat has no types
        L.heatLayer(points, { radius: 30, blur: 20, maxZoom: 10, max: 1 }).addTo(map)
      }
    }

    init()

    return () => {
      if (mapInstanceRef.current) {
        // @ts-expect-error leaflet map instance
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [profiles])

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div ref={mapRef} style={{ height: 480 }} />
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
        {profiles.length} 人のアルムナイ分布 · エリア設定済み: {profiles.filter(p => p.area && p.area.length > 0).length} 人
      </div>
    </div>
  )
}
