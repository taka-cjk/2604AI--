"use client"

type Props = {
  name: string
  avatarUrl: string | null | undefined
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
}

export function Avatar({ name, avatarUrl, size = "md" }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeMap[size]} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${sizeMap[size]} rounded-full bg-indigo-600 flex items-center justify-center shrink-0`}
    >
      <span className="font-semibold text-white">{initials}</span>
    </div>
  )
}
