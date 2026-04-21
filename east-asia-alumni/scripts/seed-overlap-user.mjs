// 期間が重なるテストユーザーを追加するスクリプト
// 実行: node scripts/seed-overlap-user.mjs

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ircvfhgjvkdwxxumsyqs.supabase.co"
const SERVICE_ROLE_KEY = "sb_secret_Ab7z27i1yUYGsEs7cJgDMQ_xhyvutI9"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 重複ユーザー2人を作成
const users = [
  {
    email: "jiwon.park.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "jiwon_park",
      full_name: "Park Ji-won",
      bio: "北京大学でCAMPUS Asiaプログラムに参加。現在ソウルでコンサルタントとして勤務。",
      home_country: "South Korea",
      current_location: "Seoul, South Korea",
      work_location: "Seoul, South Korea",
      tags: ["CAMPUS Asia", "中国語", "コンサルティング"],
    },
    histories: [
      {
        university_name: "Peking University",
        country: "China",
        program: "CAMPUS Asia",
        start_date: "2023-09-01",  // 重複: 2023-08 〜 2024-07 と被る
        end_date: "2024-06-30",
      },
    ],
  },
  {
    email: "lei.zhang.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "lei_zhang",
      full_name: "Zhang Lei",
      bio: "東京大学でCAMPUS Asiaに参加後、北京でIT企業に勤務。日中バイリンガル。",
      home_country: "China",
      current_location: "Beijing, China",
      work_location: "Beijing, China",
      tags: ["CAMPUS Asia", "日本語", "IT", "東大"],
    },
    histories: [
      {
        university_name: "The University of Tokyo",
        country: "Japan",
        program: "CAMPUS Asia",
        start_date: "2022-09-01",  // 重複: 2022-04 〜 2024-09 と被る
        end_date: "2023-08-31",
      },
      {
        university_name: "Peking University",
        country: "China",
        program: "CAMPUS Asia",
        start_date: "2023-09-01",  // 重複: 2023-08 〜 2024-07 と被る
        end_date: "2024-06-30",
      },
    ],
  },
]

for (const u of users) {
  // 既存ユーザー確認
  const { data: existing } = await supabase.auth.admin.listUsers()
  const alreadyExists = existing.users.find(x => x.email === u.email)
  if (alreadyExists) {
    console.log(`スキップ（既存）: ${u.email}`)
    continue
  }

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
  })
  if (authError) { console.error(authError.message); continue }

  const uid = authUser.user.id
  await supabase.from("profiles").update(u.profile).eq("id", uid)

  for (const h of u.histories) {
    await supabase.from("study_abroad_histories").insert({ profile_id: uid, ...h })
  }

  console.log(`✅ 作成: ${u.profile.full_name} (${u.email})`)
}

console.log("完了！")
