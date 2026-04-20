// 通知テストデータを登録するスクリプト
// 実行: node scripts/seed-notifications.mjs <your-email>
// 例:   node scripts/seed-notifications.mjs ikotakairoiro@gmail.com

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ircvfhgjvkdwxxumsyqs.supabase.co"
const SERVICE_ROLE_KEY = "sb_secret_Ab7z27i1yUYGsEs7cJgDMQ_xhyvutI9"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const targetEmail = process.argv[2]
if (!targetEmail) {
  console.error("使い方: node scripts/seed-notifications.mjs <your-email>")
  process.exit(1)
}

// 対象ユーザーのIDを取得
const { data: { users } } = await supabase.auth.admin.listUsers()
const targetUser = users.find(u => u.email === targetEmail)
if (!targetUser) {
  console.error(`ユーザーが見つかりません: ${targetEmail}`)
  process.exit(1)
}

// 架空ユーザーのプロフィールを取得（actor として使う）
const { data: actors } = await supabase
  .from("profiles")
  .select("id, full_name")
  .neq("id", targetUser.id)
  .limit(5)

if (!actors || actors.length === 0) {
  console.error("架空ユーザーが見つかりません。先に seed-users.mjs を実行してください。")
  process.exit(1)
}

console.log(`対象ユーザー: ${targetEmail} (${targetUser.id})`)
console.log(`アクター: ${actors.map(a => a.full_name).join(", ")}`)

// 既存の通知を削除
await supabase.from("notifications").delete().eq("user_id", targetUser.id)
console.log("既存の通知を削除しました")

// テスト通知データ
const now = new Date()
function minsAgo(mins) {
  return new Date(now.getTime() - mins * 60 * 1000).toISOString()
}

const notifications = [
  {
    user_id: targetUser.id,
    actor_id: actors[0].id,
    type: "follow",
    entity_id: null,
    read: false,
    created_at: minsAgo(5),
  },
  {
    user_id: targetUser.id,
    actor_id: actors[1].id,
    type: "like",
    entity_id: null,
    read: false,
    created_at: minsAgo(30),
  },
  {
    user_id: targetUser.id,
    actor_id: actors[2].id,
    type: "comment",
    entity_id: null,
    read: false,
    created_at: minsAgo(90),
  },
  {
    user_id: targetUser.id,
    actor_id: actors[0].id,
    type: "like",
    entity_id: null,
    read: true,
    created_at: minsAgo(180),
  },
  {
    user_id: targetUser.id,
    actor_id: actors[3 % actors.length].id,
    type: "event_join",
    entity_id: null,
    read: false,
    created_at: minsAgo(360),
  },
  {
    user_id: targetUser.id,
    actor_id: actors[4 % actors.length].id,
    type: "follow",
    entity_id: null,
    read: true,
    created_at: minsAgo(1440),
  },
  {
    user_id: targetUser.id,
    actor_id: actors[1].id,
    type: "message",
    entity_id: null,
    read: false,
    created_at: minsAgo(2880),
  },
]

const { error } = await supabase.from("notifications").insert(notifications)
if (error) {
  console.error("挿入エラー:", error.message)
  process.exit(1)
}

console.log(`✅ ${notifications.length}件の通知を登録しました！`)
console.log("  未読: " + notifications.filter(n => !n.read).length + "件")
console.log("  既読: " + notifications.filter(n => n.read).length + "件")
