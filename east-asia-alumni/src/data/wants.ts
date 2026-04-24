export type WantsOption = { value: string; label: string; emoji: string }

export const WANTS_OPTIONS: WantsOption[] = [
  { value: "career",   label: "キャリア相談したい",           emoji: "💼" },
  { value: "drink",    label: "飲み・ランチ友を増やしたい",    emoji: "🍻" },
  { value: "world",    label: "世界・他国の話を聞きたい",      emoji: "🌏" },
  { value: "study",    label: "勉強会・読書会をしたい",        emoji: "📚" },
  { value: "event",    label: "イベントを企画したい",           emoji: "🎉" },
  { value: "business", label: "ビジネスパートナーを探している", emoji: "🤝" },
  { value: "language", label: "語学の練習相手を探している",     emoji: "🗣️" },
  { value: "side",     label: "副業・スモールビジネスの相談",   emoji: "💡" },
  { value: "local",    label: "現地生活情報を交換したい",       emoji: "🏡" },
]

export const WANTS_MAP = Object.fromEntries(WANTS_OPTIONS.map((w) => [w.value, w]))
