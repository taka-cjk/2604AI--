import Image from "next/image"

type AvatarSize = "xs" | "sm" | "md" | "lg"

const sizeMap: Record<AvatarSize, { container: string; text: string; px: number }> = {
  xs: { container: "w-6 h-6",   text: "text-xs",   px: 24 },
  sm: { container: "w-8 h-8",   text: "text-sm",   px: 32 },
  md: { container: "w-10 h-10", text: "text-base",  px: 40 },
  lg: { container: "w-16 h-16", text: "text-xl",    px: 64 },
}

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const { container, text, px } = sizeMap[size]
  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?"

  if (src) {
    return (
      <div className={`${container} relative rounded-full overflow-hidden shrink-0 bg-slate-200 ${className}`}>
        <Image
          src={src}
          alt={name ?? "avatar"}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={`${container} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold shrink-0 ${text} ${className}`}
    >
      {initials}
    </div>
  )
}
