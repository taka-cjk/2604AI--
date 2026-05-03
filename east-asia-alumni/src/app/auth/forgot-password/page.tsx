"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-3xl mb-3">📬</div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">メールを送信しました</h2>
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">{email}</span> にパスワードリセット用のリンクを送りました。
          メールを確認してください。
        </p>
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-left">
          <p className="text-sm font-bold text-red-600 mb-1">⚠️ リンクを開く前に必ずお読みください</p>
          <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
            <li>リンクは<strong>今開いているブラウザと同じブラウザ</strong>にコピー&amp;ペーストして開いてください（他のブラウザやスマートフォンでは機能しません）</li>
            <li>リンクは<strong>1回のみ有効</strong>です。開く前にURLをコピーしておくことをおすすめします</li>
          </ul>
        </div>
        <Link href="/auth/login" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
          ログインページに戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">パスワードをお忘れですか？</h2>
      <p className="text-sm text-slate-500 mb-6">
        登録したメールアドレスを入力してください。リセット用のリンクをお送りします。
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">メールアドレス</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "送信中..." : "リセットリンクを送る"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline">
          ログインページに戻る
        </Link>
      </p>
    </div>
  )
}
