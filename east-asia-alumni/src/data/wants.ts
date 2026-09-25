export type WantsOption = { value: string; label: string; emoji: string }

export const WANTS_OPTIONS: WantsOption[] = [
  { value: "career",   label: "Career talk",    emoji: "💼" },
  { value: "drink",    label: "Casual hangout", emoji: "☕️" },
  { value: "world",    label: "World talk",     emoji: "🌏" },
  { value: "study",    label: "Travel stories", emoji: "✈️" },
  { value: "event",    label: "Host events",    emoji: "🎉" },
  { value: "business", label: "Biz partner",    emoji: "🤝" },
  { value: "language", label: "Lang exchange",  emoji: "🗣️" },
  { value: "local",    label: "Local tips",     emoji: "🏡" },
]

export const WANTS_MAP = Object.fromEntries(WANTS_OPTIONS.map((w) => [w.value, w]))
