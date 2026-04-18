// 架空ユーザー5人を登録するシードスクリプト
// 実行: node scripts/seed-users.mjs

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ircvfhgjvkdwxxumsyqs.supabase.co"
const SERVICE_ROLE_KEY = "sb_secret_Ab7z27i1yUYGsEs7cJgDMQ_xhyvutI9"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const fakeUsers = [
  {
    email: "yuki.tanaka.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "yuki_tanaka",
      full_name: "田中 結希",
      bio: "北京大学で中国語・政治学を学びました。現在は東京で国際NGOに勤務。中国語・英語・日本語トリリンガル。",
      home_country: "Japan",
      current_location: "Tokyo, Japan",
      work_location: "Tokyo, Japan",
      tags: ["国際協力", "中国語", "NGO", "留学生支援"],
    },
    study_abroad: {
      university_name: "北京大学",
      country: "China",
      program: "CAMPUS Asia",
      start_date: "2021-09-01",
      end_date: "2022-07-01",
    },
  },
  {
    email: "minho.kim.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "minho_kim",
      full_name: "Kim Min-ho",
      bio: "早稲田大学で日本語・経営学を専攻。ソウル出身、現在は上海でスタートアップを経営しています。",
      home_country: "South Korea",
      current_location: "Shanghai, China",
      work_location: "Shanghai, China",
      tags: ["起業家", "スタートアップ", "日中韓", "ビジネス"],
    },
    study_abroad: {
      university_name: "早稲田大学",
      country: "Japan",
      program: "BaiXian Asia Institute",
      start_date: "2020-04-01",
      end_date: "2021-03-01",
    },
  },
  {
    email: "liwei.chen.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "liwei_chen",
      full_name: "陳 力維",
      bio: "台湾出身。東京大学で比較文化を研究中（PhD）。東アジアの若者文化・SNSが研究テーマ。",
      home_country: "Taiwan",
      current_location: "Tokyo, Japan",
      work_location: "Tokyo, Japan",
      tags: ["研究者", "比較文化", "台湾", "PhD"],
    },
    study_abroad: {
      university_name: "東京大学",
      country: "Japan",
      program: "JASSO奨学金",
      start_date: "2022-04-01",
      end_date: null,
    },
  },
  {
    email: "sakura.nguyen.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "sakura_nguyen",
      full_name: "Nguyen Thi Sakura",
      bio: "ベトナム・ハノイ出身。延世大学で韓国語学を学び、現在は日本語教師として活動中。",
      home_country: "Vietnam",
      current_location: "Hanoi, Vietnam",
      work_location: "Hanoi, Vietnam",
      tags: ["日本語教師", "語学", "ベトナム", "文化交流"],
    },
    study_abroad: {
      university_name: "延世大学校",
      country: "South Korea",
      program: "Korean Language Program",
      start_date: "2019-03-01",
      end_date: "2021-02-01",
    },
  },
  {
    email: "taro.suzuki.alumni@example.com",
    password: "Password123!",
    profile: {
      username: "taro_suzuki",
      full_name: "鈴木 太郎",
      bio: "大阪出身。復旦大学でMBAを取得。日中間のビジネス架け橋になりたい。趣味は麻雀と中華料理。",
      home_country: "Japan",
      current_location: "Osaka, Japan",
      work_location: "Osaka, Japan",
      tags: ["MBA", "ビジネス", "日中", "中国語"],
    },
    study_abroad: {
      university_name: "復旦大学",
      country: "China",
      program: "MBA",
      start_date: "2018-09-01",
      end_date: "2020-07-01",
    },
  },
]

async function seed() {
  console.log("🌱 シードユーザーの登録を開始します...\n")

  for (const user of fakeUsers) {
    process.stdout.write(`👤 ${user.profile.full_name} を登録中... `)

    // 1. auth.users に登録（メール確認不要）
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // メール確認済みとしてマーク
      user_metadata: {
        full_name: user.profile.full_name,
        username: user.profile.username,
      },
    })

    if (authError) {
      console.log(`❌ authエラー: ${authError.message}`)
      continue
    }

    const userId = authData.user.id

    // 2. profiles テーブルを更新（triggerで自動作成された行を更新）
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: user.profile.username,
        full_name: user.profile.full_name,
        bio: user.profile.bio,
        home_country: user.profile.home_country,
        current_location: user.profile.current_location,
        work_location: user.profile.work_location,
        tags: user.profile.tags,
      })
      .eq("id", userId)

    if (profileError) {
      console.log(`❌ profileエラー: ${profileError.message}`)
      continue
    }

    // 3. study_abroad_histories に留学履歴を追加
    const { error: historyError } = await supabase
      .from("study_abroad_histories")
      .insert({
        profile_id: userId,
        university_name: user.study_abroad.university_name,
        country: user.study_abroad.country,
        program: user.study_abroad.program,
        start_date: user.study_abroad.start_date,
        end_date: user.study_abroad.end_date,
      })

    if (historyError) {
      console.log(`❌ historyエラー: ${historyError.message}`)
      continue
    }

    console.log("✅ 完了")
  }

  console.log("\n🎉 全ユーザーの登録が完了しました！")
  console.log("\n登録したアカウント:")
  fakeUsers.forEach((u) => {
    console.log(`  📧 ${u.email}  🔑 Password123!`)
  })
}

seed().catch(console.error)
