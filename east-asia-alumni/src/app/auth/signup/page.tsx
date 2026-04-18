"use client" // ブラウザ側で動かすファイル

import { useState } from "react" // 状態管理
import { useRouter } from "next/navigation" // ページ移動
import Link from "next/link" // ページ間リンク
import { createClient } from "@/lib/supabase/client" // Supabaseクライアント

export default function SignupPage() {
  const router = useRouter()

  // フォームの入力値を管理する状態
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("") // 表示名
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // フォーム送信時の処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // Supabaseに新規ユーザー登録をリクエスト
    // options.data に渡した値はユーザーのメタデータとして保存され、
    // DBトリガーがそれを読み取ってprofilesテーブルにも自動登録する
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      // 登録失敗（メール重複など）
      setError(error.message)
      setLoading(false)
      return
    }

    // 登録成功 → プロフィール設定画面へ
    router.push("/auth/onboarding")
    router.refresh()
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
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="At least 8 characters"
          />
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
