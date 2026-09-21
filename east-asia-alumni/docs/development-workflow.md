# 開発・本番環境の運用

## 環境の対応表

| 用途 | Git branch | Vercel | Supabase | migration |
|---|---|---|---|---|
| 本番 | `main` | Production | `ircvfhgjvkdwxxumsyqs` | `007`まで（新コードの本番確認後に`008`） |
| 統合開発 | `develop` | Preview | 独立したdevelopment project | 最新まで（現在`009`） |
| 個別機能 | `feature/*` | Preview | development project | 最新まで |

SupabaseのFreeプランではDatabase Branchingを利用できないため、developmentは本番とデータを共有しない2つ目のSupabaseプロジェクトとして用意する。開発用データやテストユーザーを本番へコピーしない。

## Gitの流れ

1. 最新の`develop`から`feature/<機能名>`を作る。
2. 実装・migration・テストをfeature branchで行う。
3. PRは`feature/*`から`develop`へ作る。
4. 複数機能を`develop`のVercel Previewで確認する。
5. リリース時だけ`develop`から`main`へのPRを作る。

`main`へ直接pushしない。`main`向けPRでは、アプリのデプロイと破壊的migrationの適用順序を必ず確認する。

## development Supabaseの初期設定

Supabase Dashboardで次のプロジェクトを作成する。

- Name: `east-asia-alumni-develop`
- Region: productionと同じ`Northeast Asia (Seoul)`
- Production dataのコピー: しない
- Database password: productionとは異なる強い値

作成後、現在のproduction設定が入った`.env.local`は変更せず、`.env.development.local`にdevelopmentのURL・anon key・DB passwordを設定する。Personal Access Tokenはmigration実行権限を持つものを使う。Next.jsのdevelopment実行とオンボーディング統合テストは`.env.development.local`を優先して読み込む。

その後、development projectへ明示的にリンクする。

```bash
npx supabase link --project-ref <DEVELOP_PROJECT_REF> --password "$SUPABASE_DB_PASSWORD"
npm run supabase:verify:develop
npx supabase db push
```

`supabase:verify:develop`は、次のいずれかなら失敗する。

- `.env.development.local`が存在しない、またはproductionを指している
- Supabase CLIが未リンク
- `.env.development.local`とCLIのリンク先が異なる

migration適用後、`npm run dev -- --port 3100`を起動して次を実行する。

```bash
npm run typecheck
npm test
npm run test:integration
npm run build
```

## Vercelの環境変数

Vercel Project SettingsのEnvironment Variablesを環境別に設定する。

| Key | Preview | Production |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | development URL | production URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | development anon key | production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | development service role key | production service role key |

Preview用の値をProductionへ適用しない。Production用のservice role keyをPreviewへ設定しない。環境変数変更後はPreviewを再デプロイする。

## migration 008の扱い

developmentでは`008_finalize_private_onboarding_state.sql`まで適用し、今後の機能はその構造を前提に実装する。

productionは現在`007_secure_onboarding_state_phase1.sql`までで止める。`008`は次の順序でのみ適用する。

1. `develop`から`main`へのリリースPRをレビューする。
2. 新コードをVercel Productionへデプロイする。
3. productionでログイン、オンボーディング、通常画面を確認する。
4. productionへ`008`を適用する。
5. RLS/API統合テストを再実行する。

`008`より後のmigrationも同様に、まずdevelopmentへ適用し、検証後にリリース手順へ含める。

`009_restore_legacy_profile_columns.sql`は、過去にproductionへ手動追加されていたprofile列をmigration履歴へ取り込むための冪等migrationである。productionでは既存列に対してno-opになり、クリーンなdevelopment環境では同じschemaを再現する。
