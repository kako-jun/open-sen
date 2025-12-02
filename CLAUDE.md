# open-sen

プロモーション活動を記録・可視化するダッシュボード。

## 本番環境

- **Web**: https://open-sen.llll-ll.com
- **API**: https://api.open-sen.llll-ll.com

## 名前の由来

野球の「オープン戦」にかけて:
- **オープン宣伝** - プロモーション状況をオープンに晒す
- **オープン戦（戦い）** - 有名になれるかの戦いの始まり。ドキドキしながら世に送り出す序盤戦

プロモーション状況をオープンに晒して、自虐も自慢もできるツール。

## 設計思想

### OSS開発者だけのツールではない

このツールは元々OSS開発者向けに作られたが、**より広いユーザー層**を想定している:

- **OSS開発者**: Neovimプラグイン、CLIツールなどのプロモーション
- **個人開発者**: インディーゲーム、Webサービスの告知
- **ラーメン屋オーナー**: 新店舗オープンのInstagram宣伝
- **YouTuber/クリエイター**: 動画やコンテンツの反応追跡
- **あらゆる「何かを世に出す人」**: 自分の活動がどう受け入れられているかを知りたい人

### 野球テーマで落ち込まない

プロモーションの結果が芳しくなくても、落ち込まないようにする:

- **「三振を恐れるな、バットを振れ」** - 失敗を恐れずに発信し続けることが大事
- **「全打席ホームランの選手はいない」** - バズらなくて当然、気にするな
- **「さぁ、次の打席に立て！」** - 結果に関係なく、次のアクションへ

### URLだけで完結

各プラットフォームの投稿URLを登録するだけ:
- ユーザー名やトークンの事前設定は**不要**
- 認証が必要なAPI（X/Twitter等）は手動入力で対応
- できる限り認証なしで自動取得

### プライバシー重視

- 個人情報（メールアドレス、GitHubユーザー名等）は**保存しない**
- `owner_id`はCloudflare Accessのsubject ID（ハッシュ済み）
- アバターはGitHubから取得せず、パワプロ風キャラを自動生成（予定）
- ユーザーは任意でアバターをカスタマイズ可能（予定）

### ホスティング方針

- **メイン**: https://open-sen.llll-ll.com でホスト
- **セルフホスト**: おまけ（開発者向け）

## 進捗状況

### 完了 (v1)
- [x] API基盤 (Hono + D1)
- [x] Webフロントエンド (Astro + React)
- [x] スクレイパー (GitHub, Zenn, Qiita, Note, Reddit)
- [x] UI (GitHub風ダークテーマ + 野球励ましメッセージ)
- [x] DBスキーマ (owner_id, is_public対応)
- [x] 免責事項 (README + フッター)
- [x] プラットフォーム対応 (開発者向け + 一般向け)
- [x] Cloudflare Access認証 (One-time PIN)
- [x] D1データベース作成 & マイグレーション
- [x] Workers/Pagesデプロイ
- [x] カスタムドメイン設定

### 将来 (v2)
- [ ] パワプロ風アバター生成コンポーネント
- [ ] アバターカスタマイズ機能
- [ ] 手動エンゲージメント入力UI (X, Instagram等)
- [ ] 公開ダッシュボード機能 (is_public)
- [ ] 投稿削除UI
- [ ] 通知機能（急にバズった時）
- [ ] 埋め込みウィジェット

## 技術スタック

### バックエンド
- **Cloudflare Workers**: API (Hono)
- **Cloudflare Cron Triggers**: 1日1回の定期実行（毎日15:00 UTC）
- **Cloudflare D1**: SQLiteベースのDB

### フロントエンド
- **Astro + React**: SSR + インタラクティブコンポーネント
- **Recharts**: グラフ描画
- **Cloudflare Pages**: ホスティング

### 認証
- **Cloudflare Access**: One-time PIN認証（メール）
- `/auth/*` パスのみ保護（他ページは認証なしで閲覧可能）

## 認証フロー

```
1. ユーザーが「Sign in」ボタンをクリック
   ↓
2. /auth/login にアクセス
   ↓
3. Cloudflare Access が認証画面を表示（メール → PIN入力）
   ↓
4. 認証成功後、Cloudflare Access が Cf-Access-Jwt-Assertion ヘッダー付きでリダイレクト
   ↓
5. /auth/login が JWT を CF_Authorization Cookie に保存
   ↓
6. /projects にリダイレクト
   ↓
7. APIリクエスト時、JavaScript が Cookie から JWT を取得し Authorization ヘッダーで送信
```

### 重要な実装詳細

- **Cookie はサブドメイン間で共有されない**: `open-sen.llll-ll.com` の Cookie は `api.open-sen.llll-ll.com` に送信されない
- **解決策**: クライアント側で Cookie を読み取り、`Authorization: Bearer {token}` ヘッダーで送信
- **API は3つの認証方法をサポート**:
  1. `Cf-Access-Jwt-Assertion` ヘッダー（Cloudflare Access が直接設定）
  2. `Authorization: Bearer` ヘッダー（クライアントが設定）
  3. `CF_Authorization` Cookie（同一ドメインの場合）

## データ取得方法

### 自動取得可能（URLのみで取得）

| サービス | 方法 | 取得データ |
|----------|------|-----------|
| GitHub | 公式API | Star数、Fork数、Issue数 |
| Zenn | 非公式API `/api/articles/{slug}` | いいね数、コメント数、ブックマーク数 |
| Qiita | 公式API `/api/v2/items/{id}` | いいね数、コメント数、ストック数 |
| Note | 非公式API `/api/v3/notes/{key}` | スキ数、コメント数 |
| Reddit | 公式JSON `{url}.json` | upvote数、コメント数 |

### 手動入力（認証が必要なため）

| サービス | 理由 |
|----------|------|
| X (Twitter) | 有料APIプランが必要 |
| Instagram | Business API + Meta認証が必要 |
| YouTube | Data API + Google認証が必要 |
| TikTok | 公式APIなし |
| Facebook | Graph API + Meta認証が必要 |
| Threads | 公式APIなし |

## DB設計（D1）

```sql
-- projects: owner_id追加、is_public追加
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id TEXT NOT NULL,       -- Cloudflare Access subject ID (ハッシュ済み)
  name TEXT NOT NULL,
  github_url TEXT,
  is_public INTEGER DEFAULT 0,  -- 1 = 公開ダッシュボード
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- posts, engagements, github_stats は schema.sql 参照
```

## API エンドポイント

### 公開API（認証不要）
- `GET /api/projects` - 公開プロジェクト一覧（is_public=1のみ）
- `GET /api/projects/:id` - プロジェクト詳細（is_public=1または自分のプロジェクト）
- `GET /api/projects/:id/engagements` - エンゲージメント履歴

### 認証必要API
- `GET /api/projects` - 自分のプロジェクト一覧（認証時）
- `POST /api/projects` - プロジェクト追加
- `POST /api/posts` - 投稿追加
- `DELETE /api/posts/:id` - 投稿削除
- `PATCH /api/projects/:id/visibility` - 公開設定変更

## ディレクトリ構成

```
open-sen/
├── api/                    # Cloudflare Worker (Hono)
│   ├── src/
│   │   ├── index.ts        # メインエントリ + ルート + 認証ミドルウェア
│   │   └── scrapers/       # 各サービスのスクレイパー
│   ├── wrangler.toml       # Worker設定（D1バインディング、カスタムドメイン、Cron）
│   └── package.json
├── web/                    # フロントエンド（Astro + React）
│   ├── src/
│   │   ├── layouts/        # Layout.astro（ヘッダー、ログイン状態表示）
│   │   ├── pages/
│   │   │   ├── index.astro
│   │   │   ├── auth/
│   │   │   │   ├── login.astro   # 認証後Cookie設定
│   │   │   │   └── logout.astro  # Cookie削除
│   │   │   └── projects/
│   │   │       ├── index.astro
│   │   │       ├── new.astro
│   │   │       └── [id].astro
│   │   └── components/     # React components（ProjectList, ProjectForm等）
│   ├── astro.config.mjs    # Vite define でビルド時に環境変数を埋め込み
│   ├── wrangler.toml       # Pages設定
│   └── package.json
├── schema.sql              # D1スキーマ
├── CLAUDE.md               # このファイル
└── README.md               # ユーザー向けドキュメント
```

## デプロイ手順

### 1. D1データベース作成

```bash
cd api
npx wrangler d1 create open-sen-db
# 出力されたdatabase_idをwrangler.tomlに設定

npx wrangler d1 execute open-sen-db --remote --file=../schema.sql
```

### 2. API (Workers) デプロイ

```bash
cd api
npm install
npx wrangler deploy
```

### 3. Web (Pages) デプロイ

```bash
cd web
npm install
PUBLIC_API_URL=https://api.open-sen.llll-ll.com npm run build
npx wrangler pages deploy dist
```

### 4. Cloudflare Access設定

1. Cloudflareダッシュボード → Zero Trust → Access → Applications
2. 「Add an application」→ Self-hosted
3. Application name: `open-sen`
4. Session Duration: 24 hours
5. Application domain: `open-sen.llll-ll.com`
6. **Path: `auth/*`**（重要：サイト全体ではなくauth配下のみ保護）
7. Identity providers: One-time PIN（メール認証）
8. Policy: Allow - Everyone

### 5. カスタムドメイン設定

wrangler.toml の `custom_domain = true` で自動設定される:
- `api.open-sen.llll-ll.com` → Workers（api/wrangler.toml）
- `open-sen.llll-ll.com` → Pages（Pagesダッシュボードで設定）

## ローカル開発

### API

```bash
cd api
npm install
npx wrangler dev
# http://localhost:8787
```

### Web

```bash
cd web
npm install
npm run dev
# http://localhost:4321
```

### 環境変数

```bash
# web/.env (ローカル開発用)
PUBLIC_API_URL=http://localhost:8787
```

本番ビルド時は `PUBLIC_API_URL=https://api.open-sen.llll-ll.com npm run build` で指定。
