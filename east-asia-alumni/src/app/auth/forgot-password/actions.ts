"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error: listError } = await adminClient.auth.admin.listUsers()

  if (listError) {
    return { error: `[debug] admin error: ${listError.message}` }
  }

  if (data?.users) {
    const exists = data.users.some((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!exists) {
      return { error: "そのメールアドレスは登録されていません" }
    }
  }

  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) return { error: error.message }
  return { error: null }
}
