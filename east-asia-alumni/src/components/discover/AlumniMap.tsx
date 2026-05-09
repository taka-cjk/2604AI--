"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"
import type { Profile } from "@/types/index"
import { CITY_MAP } from "@/data/cities"
import { AREA_MAP } from "@/data/areas"

type Props = {
  profiles: Profile[]
  centerProfile?: Profile | null
}

type HeatPoint = [number, number, number]

const ZOOM_THRESHOLD = 8

function resolveLatLng(p: Profile): { lat: number; lng: number } | null {
  const areas = p.area?.filter(Boolean) ?? []
  if (areas.length > 0) {
    const entry = AREA_MAP[areas[0]]
    if (entry) return { lat: entry.lat, lng: entry.lng }
  }
  if (p.current_location) {
    const city = CITY_MAP[p.current_location]
    if (city) return { lat: city.lat, lng: city.lng }
  }
  return null
}

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

function createAvatarIcon(L: typeof import("leaflet"), p: Profile): import("leaflet").DivIcon {
  const html = p.avatar_url
    ? `<div style="width:36px;height:36px;border-radius:50%;overflow:hidden;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"><img src="${p.avatar_url}" style="width:100%;height:100%;object-fit:cover"/></div>`
    : `<div style="width:36px;height:36px;border-radius:50%;background:#6366f1;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:9px;color:white;font-weight:600;text-align:center;line-height:1.2;padding:2px;">@${p.username.slice(0, 8)}</span></div>`
  return L.divIcon({ html, className: "", iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20] })
}

const SHINJUKU: [number, number] = [35.6896, 139.6917]

export default function AlumniMap({ profiles, centerProfile }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    async function init() {
      const L = (await import("leaflet")).default
      // @ts-ignore
      await import("leaflet.heat")

      const myLoc = centerProfile ? resolveLatLng(centerProfile) : null
      const center: [number, number] = myLoc ? [myLoc.lat, myLoc.lng] : SHINJUKU

      const map = L.map(mapRef.current!, {
        center,
        zoom: 12,
        scrollWheelZoom: true,
      })
      mapInstanceRef.current = map

      // ベース：CartoDB Voyager
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // オーバーレイ：OpenRailwayMap（鉄道路線）
      L.tileLayer("http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
        maxZoom: 19,
        // @ts-ignore
        opacity: 0.6,
      }).addTo(map)

      const points = resolvePoints(profiles)

      // ヒートマップ
      // @ts-expect-error leaflet.heat has no types
      const heatLayer = L.heatLayer(points, { radius: 30, blur: 20, maxZoom: 10, max: 1 })
      if (points.length > 0) heatLayer.addTo(map)

      // アバターマーカー（show_on_map なユーザーのみ）
      const markers = profiles.flatMap((p) => {
        const loc = resolveLatLng(p)
        if (!loc) return []
        const marker = L.marker([loc.lat, loc.lng], { icon: createAvatarIcon(L, p) })
        marker.bindPopup(`<a href="/profile/${p.id}" style="font-size:13px;font-weight:600;color:#4f46e5;">@${p.username}</a><br/><span style="font-size:12px;color:#64748b;">${p.full_name}</span>`)
        return [marker]
      })

      const markerLayer = L.layerGroup(markers)

      function updateLayers() {
        const zoom = map.getZoom()
        if (zoom >= ZOOM_THRESHOLD) {
          if (points.length > 0) heatLayer.remove()
          markerLayer.addTo(map)
        } else {
          markerLayer.remove()
          if (points.length > 0) heatLayer.addTo(map)
        }
      }

      map.on("zoomend", updateLayers)
      updateLayers()
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
        {profiles.length} alumni on map
      </div>
    </div>
  )
}
