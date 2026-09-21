# East Asia Alumni Network — デプロイ構成とトラブルシューティング記録

---

## 1. 全体アーキテクチャ：各サービスの役割

| サービス | 役割 | 場所・識別子 |
|---------|------|------------|
| **VS Code** | コードを書く場所 | ローカル PC |
| **GitHub** | コードの保管・履歴管理 | `taka-cjk/2604AI--`（リポジトリ） |
| **Vercel** | ビルド・ホスティング | `2604-sns-creation`（プロジェクト） |
| **Supabase** | データベース＋認証 | `ircvfhgjvkdwxxumsyqs`（プロジェクトID） |
| **Webサイト** | ユーザーが見るもの | `2604-sns-creation.vercel.app` |

---

## 2. サービス間のつながり

```
┌─────────────┐
│   VS Code   │  ← コードを書く
└──────┬──────┘
       │ git commit & push
       ▼
┌─────────────┐
│   GitHub    │  ← コードの保管庫・履歴管理
└──────┬──────┘
       │ push を検知して自動ビルド開始（GitHub Integration）
       ▼
┌─────────────┐
│   Vercel    │  ← ビルド（npm run build）→ デプロイ
└──────┬──────┘
       │ ビルド成功 → 公開
       ▼
┌──────────────────────────────┐
│  Webサイト                    │  ← ユーザーが見るもの
│  2604-sns-creation.vercel.app │
└──────────────────────────────┘
       ↕ DB クエリ・認証
┌─────────────┐
│  Supabase   │  ← ユーザーデータ・投稿・プロフィール等を保存
└─────────────┘
```

### 何を操作するとどこに影響するか

| 操作 | 影響範囲 |
|-----|---------|
| VS Code でコード変更 → `git push` | GitHub → Vercel 自動ビルド → Webサイト反映 |
| Vercel で Environment Variables を追加 | 次のデプロイから反映（即時ではない） |
| Vercel で手動 Redeploy | 同じコードを再ビルド・再デプロイ |
| Supabase でテーブル変更（SQL実行） | アプリのDBに即時反映 |
| `.env.local` を変更 | ローカル開発のみ。Vercelには**自動反映されない** |

---

## 3. 今回の実装の進行順序

1. `wants`（やりたいこと）フィールドの追加
   - Supabase SQL エディターで `ALTER TABLE profiles ADD COLUMN wants TEXT[]`
   - `src/data/wants.ts` 作成（9種類の選択肢）
   - `src/types/index.ts` / `src/types/database.generated.ts` に型追加
   - プロフィール編集ページ・表示ページ・Discover フィルターに UI 追加
   - シードスクリプトに wants データ追加・実行

2. Vercel へのデプロイ（ここから多数のエラーと戦った）

---

## 4. 詰まったポイントと解決策

### 4.1 TypeScript ビルドエラー（3件）

**問題：** `event_type: string` が `EventType` に代入できない等

```
Type 'string' is not assignable to type 'EventType'
```

> **原因と教訓**
> Supabase が DB から返す値はすべて `string` 型。だがアプリ側の型定義は `'dinner' | 'study' | ...` のような union 型。型が噛み合わない。

**解決：** `as EventType`、`as EventWithOrganizer[]` でキャスト

---

**問題：** `leaflet.heat` に型宣言ファイルがない

**解決：** `src/types/leaflet-heat.d.ts` 作成 ＋ インポート行に `// @ts-ignore` 追記

---

### 4.2 Vercel が古いコミットからビルドしていた

> **詰まりポイント**
> Vercel ダッシュボードで古いデプロイの「Redeploy」ボタンを押すと、**そのデプロイ時点のコミット**（古いコード）から再ビルドされる。最新コードではない！

**解決：** 空コミットを push して Vercel に最新 HEAD を拾わせる

```bash
git commit --allow-empty -m "chore: trigger Vercel redeploy"
git push origin main
```

---

### 4.3 profile/edit のプリレンダリングエラー

**問題：**
```
Error: @supabase/ssr: Your project's URL and API key are required
```

> **詰まりポイント**
> `"use client"` ページでも、Next.js はビルド時に静的プリレンダリングを試みる。そのときに Supabase クライアントの生成が走り、ビルド環境に環境変数がないとクラッシュする。

**解決：** `profile/edit/page.tsx` の先頭に追加

```ts
"use client"
export const dynamic = 'force-dynamic'  // ← ビルド時プリレンダリングを無効化
```

---

### 4.4 Vercel に環境変数が未設定

**問題：** ビルドは通るが runtime でクラッシュ

> **詰まりポイント**
> ローカルの `.env.local` は Vercel に**自動では反映されない**。
> Vercel 用に別途 Settings で登録が必要。

**解決：** Vercel → プロジェクト → Settings → **Environment Variables** に3つ追加

| Key | 値の場所 |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` の同名の値 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` の同名の値（publishable key） |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` の同名の値（secret key） |

追加後は空コミット push か Redeploy が必要。

---

### 4.5 MIDDLEWARE_INVOCATION_FAILED（最大の詰まり）

**エラー：** サイトにアクセスするたびに 500 エラー

```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
```

> **詰まりポイント（複数の原因が重なっていた）**
>
> **原因1 — `src/middleware.ts` → `src/proxy.ts` への移行漏れ**
> Next.js 16 では `middleware` ファイルの名前規約が `proxy` に変更。
> `src/middleware.ts` は codemod で `src/proxy.ts` に移行できたが、
> **リポジトリ内の別の場所（`east-asia-alumni/middleware.ts`）にも同名ファイルが残っており、見落としていた。**
>
> **原因2 — `@supabase/ssr` が Edge ランタイムで動作しない**
> Vercel の proxy/middleware は Edge 環境で動く。
> `@supabase/ssr` は内部で `__dirname`（Node.js 専用）を使っており、Edge では `ReferenceError` でクラッシュ。

**解決：** ルートレベルの `middleware.ts` を完全削除

```bash
git rm middleware.ts
git commit -m "fix: root-level middleware.ts を削除"
git push origin main
```

---

### 4.6 Framework Preset が「Other」（全404の根本原因）

**問題：** ビルドは成功するのに、全ページが 404

```
404: NOT_FOUND
Code: NOT_FOUND
```

> **根本原因**
> Vercel の **Build & Deployment Settings → Framework Preset** が **「Other」** になっていた。
> Vercel が Next.js プロジェクトと認識できず、ルーティング・サービングの設定が汎用のものになっていたため、全ページが 404 になっていた。

**解決：** Vercel → Settings → Build and Deployment → Framework Preset を **「Next.js」** に変更 → Save → Redeploy

---

## 5. 運用上の注意点まとめ

### オンボーディング非公開化migrationの適用順序

オンボーディング状態を公開`profiles`から非公開`user_onboarding`へ移す変更は、
本番停止を避けるため二段階になっている。

1. `007_secure_onboarding_state_phase1.sql`を適用する（適用済み）
2. `user_onboarding`を参照するアプリケーションコードをVercel本番へデプロイする
3. 新規登録・ログイン・オンボーディング・通常画面への遷移を確認する
4. デプロイ確認後に`008_finalize_private_onboarding_state.sql`を適用する
5. RLS/API統合テストを再実行する

> **重要:** 手順2より前に`008`を適用すると、旧本番コードが参照している
> `profiles.onboarding_completed_at`などの列がなくなり、本番サイトが壊れる。
> 新コードの本番反映を確認するまで、`supabase db push`で`008`を適用しないこと。

### git push すると自動デプロイされる
- `main` ブランチへの push は自動で Vercel のビルドをトリガー
- ビルド失敗しても前のデプロイは維持される（サイトは落ちない）

### 環境変数の変更はデプロイが必要
- Vercel で環境変数を追加・変更 → 空コミット push か手動 Redeploy

### Vercel の「Redeploy」ボタンの注意
- **古いデプロイの Redeploy** → そのコミット時点のコードが使われる（最新コードではない）
- 最新コードを使いたいなら push するか、**最新デプロイの Redeploy** を押す

### パスワードを忘れたとき
- Supabase はパスワードを平文で保存しない（ハッシュ化）
- **Supabase ダッシュボード → Authentication → Users → 該当ユーザー → Send password recovery email**
