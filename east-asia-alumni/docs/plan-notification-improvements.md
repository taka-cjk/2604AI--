# 通知システム改善プラン

## Context

通知の発火が一部未実装（フォロー通知・コメント通知）で、ナビバーに未読バッジもなかった。  
ユーザーがフォロー・コメント・メンションされても気づきにくい状態を改善する。  
また通知画面をカテゴリごとに既読できるようにする。

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `src/types/index.ts` | `thread_reply` を NotificationType に追加 |
| `src/app/(main)/layout.tsx` | async化・未読数取得・Sidebar/BottomNavに渡す |
| `src/components/layout/Sidebar.tsx` | `unreadCount` prop 追加・Notifications に赤バッジ |
| `src/components/layout/BottomNav.tsx` | 同上（モバイル） |
| `src/components/profile/FollowButton.tsx` | フォロー時に `follow` 通知を送信 |
| `src/components/discover/UserCard.tsx` | 同上（Discoverのフォローボタン） |
| `src/components/feed/PostCard.tsx` | コメント時に `comment`（投稿主）・`thread_reply`（スレッド参加者）通知追加 |
| `src/components/notifications/NotificationList.tsx` | `thread_reply` 表示設定・カテゴリ別既読ボタン・FollowBackButton に通知追加 |

---

## 通知トリガー一覧

| アクション | 通知タイプ | 受信者 |
|---|---|---|
| フォローする | `follow` | フォローされたユーザー |
| フォローバックする | `follow` | フォローバックされたユーザー |
| 投稿にコメントする | `comment` | 投稿主（自分が投稿主の場合は除外） |
| コメントで@メンション | `mention` | メンションされたユーザー |
| 自分がいるスレッドにコメント | `thread_reply` | 投稿本文・既存コメントで@メンションされたユーザー |

---

## ナビバーバッジ設計

- `layout.tsx`（サーバーコンポーネント）で未読数を取得し props で渡す
- Sidebar/BottomNav の Notifications アイコン右上に赤丸（`h-2 w-2`）
- 次回ページロード時に再取得（リアルタイム更新は将来対応）

---

## カテゴリ別既読

- 各グループヘッダーに「既読にする」ボタンを追加（未読が1件以上ある場合のみ表示）
- クリックでそのカテゴリの通知IDを一括で `read: true` に更新
- 「すべて既読にする」ボタンも引き続き使用可能
