export type WantsOption = { value: string; label: string; emoji: string }

export const WANTS_OPTIONS: WantsOption[] = [
  { value: "career",   label: "Career advice",                     emoji: "💼" },
  { value: "drink",    label: "Find people to grab drinks / lunch", emoji: "🍻" },
  { value: "world",    label: "Hear stories from around the world", emoji: "🌏" },
  { value: "study",    label: "Study groups & book clubs",          emoji: "📚" },
  { value: "event",    label: "Organize events",                    emoji: "🎉" },
  { value: "business", label: "Looking for a business partner",     emoji: "🤝" },
  { value: "language", label: "Language exchange partner",          emoji: "🗣️" },
  { value: "side",     label: "Side hustle / small business",       emoji: "💡" },
  { value: "local",    label: "Exchange local life tips",           emoji: "🏡" },
]

export const WANTS_MAP = Object.fromEntries(WANTS_OPTIONS.map((w) => [w.value, w]))
