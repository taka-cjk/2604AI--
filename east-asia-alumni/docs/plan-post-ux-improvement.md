# 投稿UI/UX改善プラン

## 背景

- 投稿フォームで Enter を押すと意図せず投稿されてしまう問題があった
- コメント入力欄が狭く（横1行）、改行もできなかった
- コメントUIを「投稿フォームを小さくして内蔵したイメージ」に近づけたい

---

## 変更内容

### `src/components/ui/MentionInput.tsx`

- `<input type="text">` → `<textarea>` に変更
- `onSubmit` prop を削除（Enter キーで送信する仕組みを廃止）
- ref 型を `HTMLInputElement` → `HTMLTextAreaElement` に更新
- handleKeyDown から Enter→submit 処理を削除
- **結果：** Enter で改行、送信はボタンのみ（投稿・コメント共通）

### `src/components/feed/CreatePostForm.tsx`

- MentionInput に渡していた `onSubmit={handleSubmit}` を削除
- `min-h-[72px]` を追加して最低3行分の高さを確保

### `src/components/feed/PostCard.tsx`

- コメントフォームを `flex gap-2`（横並び）→ `flex flex-col gap-2`（縦並び）に変更
- MentionInput を全幅・`min-h-[48px]`（2行分）に変更
- 送信ボタンを右寄せで1行下に配置
- フォーム全体を `rounded-xl border` のカード風デザインに

---

## 動作仕様（変更後）

| 操作 | 投稿フォーム | コメントフォーム |
|------|------------|----------------|
| Enter | 改行 | 改行 |
| 「投稿する」ボタン | 投稿 | — |
| 「送信」ボタン | — | コメント送信 |
| @ 入力 | 候補ドロップダウン表示 | 同左 |
| Escape | ドロップダウンを閉じる | 同左 |
