export type AreaEntry = {
  name: string   // DB key (Japanese, do not change)
  label: string  // English display name
  city: string
  lat: number
  lng: number
}

export const AREAS: AreaEntry[] = [
  // ── Tokyo areas ──────────────────────────────────────────────────────────
  { name: "東京（東京駅・丸の内）", label: "Tokyo Station / Marunouchi", city: "Tokyo", lat: 35.6812, lng: 139.7671 },
  { name: "新宿",                   label: "Shinjuku",                   city: "Tokyo", lat: 35.6896, lng: 139.7006 },
  { name: "渋谷",                   label: "Shibuya",                    city: "Tokyo", lat: 35.6580, lng: 139.7016 },
  { name: "六本木",                 label: "Roppongi",                   city: "Tokyo", lat: 35.6627, lng: 139.7310 },
  { name: "銀座・有楽町",           label: "Ginza / Yurakucho",          city: "Tokyo", lat: 35.6717, lng: 139.7640 },
  { name: "品川",                   label: "Shinagawa",                  city: "Tokyo", lat: 35.6284, lng: 139.7387 },
  { name: "恵比寿・代官山",         label: "Ebisu / Daikanyama",         city: "Tokyo", lat: 35.6467, lng: 139.7100 },
  { name: "池袋",                   label: "Ikebukuro",                  city: "Tokyo", lat: 35.7295, lng: 139.7109 },
  { name: "上野・秋葉原",           label: "Ueno / Akihabara",           city: "Tokyo", lat: 35.7089, lng: 139.7745 },
  { name: "中目黒・自由が丘",       label: "Nakameguro / Jiyugaoka",     city: "Tokyo", lat: 35.6438, lng: 139.6977 },
]

export const AREA_MAP: Record<string, AreaEntry> = Object.fromEntries(
  AREAS.map((a) => [a.name, a])
)

export const TOKYO_AREAS = AREAS.filter((a) => a.city === "Tokyo")
