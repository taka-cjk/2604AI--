type Size = "sm" | "md" | "lg"

type Props = {
  name: string
  avatarUrl: string | null | undefined
  size?: Size
}

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 w-9 text-sm",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
}

export function Avatar({ name, avatarUrl, size = "md" }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${SIZE_CLASS[size]} rounded-full object-cover shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${SIZE_CLASS[size]} rounded-full bg-indigo-100 flex items-center justify-center shrink-0 font-semibold text-indigo-600`}
    >
      {initials}
    </div>
  )
}
