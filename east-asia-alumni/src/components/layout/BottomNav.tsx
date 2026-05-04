"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    label: "Home",
    href: "/feed",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5v9.75c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75V10.5" />
        <path strokeLinecap="round" d="M8 14.5h8" strokeWidth={1.2} />
        <path strokeLinecap="round" d="M8.75 17h1.25M12 17h1.25M15.25 17h-1.25M8.75 19h1.25M12 19h1.25" strokeWidth={1.2} />
      </svg>
    ),
  },
  {
    label: "Discover",
    href: "/discover",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile/me",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

export function BottomNav({
  unreadCount = 0,
  avatarUrl,
  fullName,
}: {
  unreadCount?: number
  avatarUrl?: string | null
  fullName?: string
}) {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/profile/me" && pathname.startsWith(item.href))
        const isProfile = item.href === "/profile/me"

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center py-3 transition-colors ${
              isActive ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <span className="relative">
              {isProfile && avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName ?? "profile"}
                  className={`h-7 w-7 rounded-full object-cover ${
                    isActive ? "ring-2 ring-indigo-500" : "ring-1 ring-slate-200"
                  }`}
                />
              ) : (
                item.icon
              )}
              {item.href === "/notifications" && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
