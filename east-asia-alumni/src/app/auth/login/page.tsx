"use client" // このファイルはブラウザ側で動かす（ボタン操作やフォーム入力を扱うため）

import { useState } from "react" // 入力値やエラーなどの「状態」を管理するReactの機能
import { useRouter } from "next/navigation" // ログイン後に別ページへ移動するための機能
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { PasswordInput } from "@/components/ui/PasswordInput"

export default function LoginPage() {
  const router = useRouter() // ページ移動に使う

  // フォームの入力値を管理する状態
  const [email, setEmail] = useState("") // メールアドレス
  const [password, setPassword] = useState("") // パスワード
  const [error, setError] = useState<string | null>(null) // エラーメッセージ（なければnull）
  const [loading, setLoading] = useState(false) // 送信中かどうか（二重送信防止）

  // フォームが送信されたときの処理
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault() // ブラウザのデフォルト動作（ページリロード）を止める
    setError(null) // 前のエラーをリセット
    setLoading(true) // ボタンを「送信中」に変える

    const supabase = createClient() // Supabaseクライアントを作成

    // Supabaseにメール＋パスワードでログインをリクエスト
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // ログイン失敗のとき（パスワード間違いなど）
      setError("Email or password is incorrect.")
      setLoading(false) // ボタンを元に戻す
      return
    }

    // ログイン成功 → フィードページへ移動
    router.push("/feed")
    router.refresh() // サーバー側のセッション情報も更新する
  }

  return (
    // カード風のコンテナ
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Sign in</h2>

      {/* ログインフォーム */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* メールアドレス入力欄 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)} // 入力のたびにstateを更新
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="you@example.com"
          />
        </div>

        {/* パスワード入力欄 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-indigo-600 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" required />
        </div>

        {/* エラーがあるときだけ表示 */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* 送信ボタン：送信中はdisabledにして二重送信を防ぐ */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* サインアップページへのリンク */}
      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="font-medium text-indigo-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
