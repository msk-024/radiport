# Radiport

香川県の4ラジオ局をまとめて聴けるPWAアプリ。

---

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Next.js 16.2.4（App Router） |
| UI | React 19 / Tailwind CSS v4 |
| 言語 | TypeScript 5（strict） |
| DB / 認証 | Supabase（@supabase/ssr） |
| 状態管理 | Zustand 5 |
| バリデーション | Zod 4 |
| プッシュ通知 | web-push + Service Worker |
| PWA | Next.js 16 ネイティブ（manifest.ts + public/sw.js） |

---

## できること

### ホーム画面（`/`）
- **現在放送中の番組**を自動取得・表示（JST換算、曜日・時刻で絞り込み）
- **もうすぐ放送**セクション：60分以内に開始する番組を開始時刻順で表示
- **局を選ぶ**セクション：全局一覧から直接タップして再生

### 再生画面（`/player`）
- 局のストリーミング再生（internal局）／外部アプリ起動（radiko等）
- 再生 / 一時停止 / 停止
- 音量スライダー（internal局のみ）
- 放送中の番組名・パーソナリティ表示
- **番組フォローボタン**
- **「番組へメッセージを送る」ボタン**（`message_url` が設定されている番組のみ表示）
- **ハッシュタグボタン**（`hashtag` が設定されている番組のみ。タップするとX（Twitter）の投稿画面を番組名入りで開く）
- パルスアニメーション・イコライザーバーのビジュアル

### ミニプレイヤーバー
- 再生中は全ページ共通でボトムナビ上部に固定表示
- タップでプレイヤー画面へ遷移
- 再生/一時停止を直接操作可能

### フォロー機能
- 番組ごとにフォロー／アンフォロー（Server Actions）
- RLSにより自分のデータのみ操作可能

### プッシュ通知（`/settings`）
- Web Push購読登録・解除
- デバイスごとに `push_subscriptions` テーブルで管理
- Service Workerが通知を受信・表示、クリックでアプリを開く

### 匿名認証
- 初回アクセス時にSupabase匿名認証で自動ユーザー作成
- DBトリガーにより `profiles` レコードも自動生成
- Middleware でセッションをリクエストごとにリフレッシュ

### PWAインストールガイド
- iOS（Safari）の初回アクセス時にモーダルで3ステップ案内
- 「わかった」で閉じると `localStorage` に記録し、以降は非表示
- インストール済み（standalone モード）は表示しない

---

## ディレクトリ構成

```
radiport/
├── app/
│   ├── (main)/
│   │   ├── page.tsx          # ホーム画面
│   │   ├── player/page.tsx   # 再生画面
│   │   ├── settings/page.tsx # 設定画面
│   │   ├── layout.tsx        # ミニプレイヤー・ボトムナビ
│   │   └── _components/
│   │       └── BottomNav.tsx
│   ├── api/push/
│   │   ├── subscribe/route.ts
│   │   └── unsubscribe/route.ts
│   ├── layout.tsx            # ルートレイアウト（AnonAuthProvider・PwaInstallGuide）
│   └── manifest.ts           # PWAマニフェスト
├── features/
│   ├── auth/components/
│   │   └── AnonAuthProvider.tsx   # 匿名認証の自動初期化
│   ├── follows/
│   │   ├── actions.ts             # Server Actions (follow / unfollow)
│   │   └── components/FollowButton.tsx
│   ├── player/
│   │   ├── components/
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── PlayerBar.tsx
│   │   │   ├── PulseAnimation.tsx
│   │   │   ├── EqualizerBars.tsx
│   │   │   └── ExternalLaunchOverlay.tsx
│   │   └── store/playerStore.ts   # Zustand再生状態
│   ├── programs/components/
│   │   ├── ProgramCard.tsx        # 放送中番組カード（プログレスバー付き）
│   │   └── UpcomingProgramCard.tsx
│   ├── push/components/
│   │   └── PushNotificationManager.tsx
│   ├── pwa/components/
│   │   └── PwaInstallGuide.tsx    # iOSインストールガイドモーダル
│   └── stations/components/
│       └── StationCard.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts     # ブラウザ用クライアント
│   │   └── server.ts     # サーバー用クライアント（Cookie対応）
│   └── types/database.ts # DB型定義・型エイリアス
├── middleware.ts           # Supabaseセッションリフレッシュ
├── public/
│   ├── sw.js              # Service Worker
│   └── icons/             # PWAアイコン（要配置）
└── supabase/migrations/
    ├── 001_initial.sql                    # テーブル・RLS・トリガー・初期データ
    └── 002_programs_message_hashtag.sql   # message_url / hashtag カラム追加
```

---

## DBスキーマ

```
stations            ラジオ局マスタ（stream_url / playback_type）
programs            番組マスタ（message_url / hashtag 含む）
schedules           放送スケジュール（day_of_week, start_time, end_time）
profiles            ユーザープロフィール（匿名フラグ付き）
follows             番組フォロー（user_id × program_id）
push_subscriptions  Web Push購読情報（endpoint / p256dh / auth）
```

RLSにより `stations` / `programs` / `schedules` は全員読み取り可能。
`profiles` / `follows` / `push_subscriptions` は自分のデータのみ操作可能。

---

## 環境変数

`.env.local.example` を参照。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=
```

VAPID鍵の生成：

```bash
npx web-push generate-vapid-keys
```

---

## セットアップ

```bash
npm install
```

Supabase Dashboardで実施:

1. `supabase/migrations/001_initial.sql` を SQL Editor で実行
2. `supabase/migrations/002_programs_message_hashtag.sql` を実行
3. Authentication > Configuration > **Anonymous sign-ins を有効化**

```bash
npm run dev
```

---

## 未実装・今後の課題

- stream_URL の実動確認（FM815 / FM SUN は参考値）
- `public/icons/` へのPWAアイコン配置（192×192 / 512×512）
- プッシュ通知の送信トリガー（放送開始前の自動送信バッチ等）
- 番組詳細ページ（番組説明・ポッドキャストフィード）
- Android向けPWAインストールガイド（`beforeinstallprompt` イベント利用）
