// avatars バケットを作成するセットアップスクリプト
// 実行: node scripts/setup-storage.mjs

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://ircvfhgjvkdwxxumsyqs.supabase.co"
const SERVICE_ROLE_KEY = "sb_secret_Ab7z27i1yUYGsEs7cJgDMQ_xhyvutI9"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function setup() {
  console.log("🗂️  avatars バケットを作成中...")

  // バケット作成（public = 認証なしで画像を表示できる）
  const { error } = await supabase.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 2097152, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  })

  if (error && error.message !== "The resource already exists") {
    console.error("❌ エラー:", error.message)
    return
  }

  console.log("✅ avatars バケット作成完了（または既存）")
  console.log("\n📋 次のSQL を Supabase Dashboard > SQL Editor で実行してください:")
  console.log(`
-- アバター画像の RLS ポリシー
-- storage.objects への操作を許可する

-- 誰でも画像を閲覧できる
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 自分のフォルダにのみアップロード可能
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 自分のアバターのみ更新可能
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 自分のアバターのみ削除可能
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
  `)
}

setup().catch(console.error)
