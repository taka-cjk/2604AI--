import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components to stay in sync
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/auth')
  const isProtectedPage = [
    '/feed',
    '/discover',
    '/profile',
    '/events',
    '/messages',
    '/notifications',
  ].some((p) => pathname.startsWith(p))

  // Redirect unauthenticated users away from protected pages
  if (!user && isProtectedPage) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  const authExemptPages = ['/auth/onboarding', '/auth/reset-password', '/auth/callback', '/auth/confirm']
  // Redirect authenticated users away from auth pages (except onboarding/reset-password/callback)
  if (user && isAuthPage && !authExemptPages.some((p) => pathname.startsWith(p))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/feed'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
