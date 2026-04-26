"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PasswordInput } from "@/components/ui/PasswordInput"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError("パスワードが一致しません")
      return
    }
    if (password.length < 8) {
      setError("パスワードは8文字以上にしてください")
      return
    }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/feed")
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-900 mb-2">パスワードを再設定</h2>
      <p className="text-sm text-slate-500 mb-6">新しいパスワードを入力してください</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">新しいパスワード</label>
          <PasswordInput value={password} onChange={setPassword} placeholder="8文字以上" required minLength={8} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">確認</label>
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="もう一度入力" required />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "更新中..." : "パスワードを更新"}
        </button>
      </form>
    </div>
  )
}
