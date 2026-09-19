"use client" // ブラウザ側で動かすファイル

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { PasswordInput } from "@/components/ui/PasswordInput"

export default function SignupPage() {
  const router = useRouter()

  // フォームの入力値を管理する状態
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("") // 表示名
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // フォーム送信時の処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const cleanName = fullName.trim()
    if (!cleanName) {
      setError("Full name is required.")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Supabaseに新規ユーザー登録をリクエスト
    // options.data に渡した値はユーザーのメタデータとして保存され、
    // DBトリガーがそれを読み取ってprofilesテーブルにも自動登録する
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: cleanName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/auth/onboarding`,
      },
    })

    if (error) {
      // 登録失敗（メール重複など）
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    // 登録成功 → プロフィール設定画面へ
    router.push("/auth/onboarding")
    router.refresh()
  }

  if (emailSent) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl" aria-hidden="true">📧</div>
        <h2 className="mb-2 text-xl font-semibold text-slate-900">Check your email</h2>
        <p className="text-sm text-slate-600">
          We sent a confirmation link to <span className="font-medium text-slate-900">{email}</span>.
          Open it to continue onboarding.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Create account</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* 表示名入力欄 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full name
          </label>
          <input
            type="text"
            required
            maxLength={100}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Taro Yamada"
          />
        </div>

        {/* メールアドレス入力欄 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="you@example.com"
          />
        </div>

        {/* パスワード入力欄（最低8文字） */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <PasswordInput value={password} onChange={setPassword} placeholder="At least 8 characters" required minLength={8} />
        </div>

        {/* エラーメッセージ */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      {/* ログインページへのリンク */}
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
