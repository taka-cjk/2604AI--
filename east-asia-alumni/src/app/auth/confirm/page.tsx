"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "expired" | "error">("loading")

  useEffect(() => {
    const hash = window.location.hash
    const params = new URLSearchParams(hash.substring(1))

    if (params.get("error")) {
      const errorCode = params.get("error_code")
      setStatus(errorCode === "otp_expired" ? "expired" : "error")
      return
    }

    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")
    const type = params.get("type")

    // implicit flow: ハッシュからトークンを取得してセッションを明示的に確立
    if (accessToken) {
      const supabase = createClient()
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
      }).then(({ error }) => {
        if (error) { setStatus("error"); return }
        router.replace(type === "recovery" ? "/auth/reset-password" : "/feed")
      })
      return
    }

    // フォールバック: PKCE flow 等
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/auth/reset-password")
      } else if (event === "SIGNED_IN") {
        router.replace("/feed")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (status === "expired") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-4xl mb-4">⏰</div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Link has expired</h2>
        <p className="text-sm text-slate-500 mb-6">
          Password reset links expire after a set time.<br />
          Please request a new reset email.
        </p>
        <Link
          href="/auth/forgot-password"
          className="inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Send reset email again
        </Link>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Authentication failed</h2>
        <p className="text-sm text-slate-500 mb-6">The link is invalid. Please try again.</p>
        <Link href="/auth/login" className="text-sm text-indigo-600 hover:underline">
          Go to login
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
      <p className="text-sm text-slate-500">Authenticating...</p>
    </div>
  )
}
