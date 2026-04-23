export type CityEntry = {
  name: string
  country: string
  lat: number
  lng: number
}

export const CITIES: CityEntry[] = [
  // ── Japan ─────────────────────────────────────────────────────────────────
  { name: "Tokyo",     country: "Japan",       lat: 35.6762, lng: 139.6503 },
  { name: "Osaka",     country: "Japan",       lat: 34.6937, lng: 135.5023 },
  { name: "Kyoto",     country: "Japan",       lat: 35.0116, lng: 135.7681 },
  { name: "Nagoya",    country: "Japan",       lat: 35.1815, lng: 136.9066 },
  { name: "Sapporo",   country: "Japan",       lat: 43.0618, lng: 141.3545 },
  { name: "Fukuoka",   country: "Japan",       lat: 33.5904, lng: 130.4017 },
  { name: "Sendai",    country: "Japan",       lat: 38.2682, lng: 140.8694 },
  { name: "Kobe",      country: "Japan",       lat: 34.6901, lng: 135.1955 },
  { name: "Yokohama",  country: "Japan",       lat: 35.4437, lng: 139.6380 },
  { name: "Tsukuba",   country: "Japan",       lat: 36.0832, lng: 140.0765 },

  // ── China ─────────────────────────────────────────────────────────────────
  { name: "Beijing",   country: "China",       lat: 39.9042, lng: 116.4074 },
  { name: "Shanghai",  country: "China",       lat: 31.2304, lng: 121.4737 },
  { name: "Shenzhen",  country: "China",       lat: 22.5431, lng: 114.0579 },
  { name: "Guangzhou", country: "China",       lat: 23.1291, lng: 113.2644 },
  { name: "Hangzhou",  country: "China",       lat: 30.2741, lng: 120.1551 },
  { name: "Nanjing",   country: "China",       lat: 32.0603, lng: 118.7969 },
  { name: "Chengdu",   country: "China",       lat: 30.5728, lng: 104.0668 },
  { name: "Wuhan",     country: "China",       lat: 30.5928, lng: 114.3055 },
  { name: "Xi'an",     country: "China",       lat: 34.3416, lng: 108.9398 },
  { name: "Tianjin",   country: "China",       lat: 39.3434, lng: 117.3616 },

  // ── Korea ─────────────────────────────────────────────────────────────────
  { name: "Seoul",     country: "Korea",       lat: 37.5665, lng: 126.9780 },
  { name: "Busan",     country: "Korea",       lat: 35.1796, lng: 129.0756 },
  { name: "Incheon",   country: "Korea",       lat: 37.4563, lng: 126.7052 },
  { name: "Daegu",     country: "Korea",       lat: 35.8714, lng: 128.6014 },

  // ── Taiwan ────────────────────────────────────────────────────────────────
  { name: "Taipei",    country: "Taiwan",      lat: 25.0330, lng: 121.5654 },
  { name: "Taichung",  country: "Taiwan",      lat: 24.1477, lng: 120.6736 },
  { name: "Tainan",    country: "Taiwan",      lat: 22.9999, lng: 120.2269 },
  { name: "Kaohsiung", country: "Taiwan",      lat: 22.6273, lng: 120.3014 },

  // ── Hong Kong / Singapore ─────────────────────────────────────────────────
  { name: "Hong Kong",   country: "Hong Kong",   lat: 22.3193, lng: 114.1694 },
  { name: "Singapore",   country: "Singapore",   lat: 1.3521,  lng: 103.8198 },

  // ── Southeast Asia ────────────────────────────────────────────────────────
  { name: "Bangkok",     country: "Thailand",    lat: 13.7563, lng: 100.5018 },
  { name: "Ho Chi Minh", country: "Vietnam",     lat: 10.8231, lng: 106.6297 },
  { name: "Hanoi",       country: "Vietnam",     lat: 21.0278, lng: 105.8342 },
  { name: "Kuala Lumpur",country: "Malaysia",    lat: 3.1390,  lng: 101.6869 },
  { name: "Jakarta",     country: "Indonesia",   lat: -6.2088, lng: 106.8456 },
  { name: "Manila",      country: "Philippines", lat: 14.5995, lng: 120.9842 },

  // ── USA ───────────────────────────────────────────────────────────────────
  { name: "New York",    country: "USA",         lat: 40.7128, lng: -74.0060 },
  { name: "San Francisco",country: "USA",        lat: 37.7749, lng: -122.4194 },
  { name: "Los Angeles", country: "USA",         lat: 34.0522, lng: -118.2437 },
  { name: "Boston",      country: "USA",         lat: 42.3601, lng: -71.0589 },
  { name: "Washington DC",country: "USA",        lat: 38.9072, lng: -77.0369 },
  { name: "Chicago",     country: "USA",         lat: 41.8781, lng: -87.6298 },

  // ── UK / Europe ───────────────────────────────────────────────────────────
  { name: "London",      country: "UK",          lat: 51.5074, lng: -0.1278 },
  { name: "Paris",       country: "France",      lat: 48.8566, lng: 2.3522 },
  { name: "Berlin",      country: "Germany",     lat: 52.5200, lng: 13.4050 },
  { name: "Geneva",      country: "Switzerland", lat: 46.2044, lng: 6.1432 },
  { name: "Amsterdam",   country: "Netherlands", lat: 52.3676, lng: 4.9041 },

  // ── Oceania ───────────────────────────────────────────────────────────────
  { name: "Sydney",      country: "Australia",   lat: -33.8688, lng: 151.2093 },
  { name: "Melbourne",   country: "Australia",   lat: -37.8136, lng: 144.9631 },

  // ── Canada ────────────────────────────────────────────────────────────────
  { name: "Toronto",     country: "Canada",      lat: 43.6532, lng: -79.3832 },
  { name: "Vancouver",   country: "Canada",      lat: 49.2827, lng: -123.1207 },
]

export const CITY_MAP: Record<string, CityEntry> = Object.fromEntries(
  CITIES.map((c) => [c.name, c])
)
