# open-sen

プロモーション活動を記録・可視化するダッシュボード。

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

## コンセプト

- 投稿先（Zenn, Qiita, Note, X, Reddit, Instagram, YouTube等）を登録
- 1日1回エンゲージメント（いいね、コメント数など）を取得
- 時系列グラフで推移を表示
- URLを公開して「こんな感じです」と晒せる

## 技術スタック

### バックエンド
- **Cloudflare Workers**: API、データ取得
- **Cloudflare Cron Triggers**: 1日1回の定期実行
- **Cloudflare D1**: SQLiteベースのDB

### フロントエンド
- **Cloudflare Pages**: 静的サイトホスティング
- React or Vue or Svelte（未定）

### 認証
- **Cloudflare Access**: GitHub認証（追加・編集用）

## データ取得方法

### 自動取得可能（URLのみで取得）

| サービス | 方法 | 取得データ |
|----------|------|-----------|
| GitHub | 公式API | Star数、Fork数、Issue数 |
| Zenn | 非公式API | いいね数、コメント数、ブックマーク数 |
| Qiita | 公式API | いいね数、コメント数、ストック数 |
| Note | 非公式API | スキ数、コメント数 |
| Reddit | 公式JSON API | upvote数、コメント数 |

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

### projects テーブル
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,           -- プロジェクト名（例: chunkundo.nvim）
  github_url TEXT,              -- GitHubリポジトリURL
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### posts テーブル
```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  platform TEXT NOT NULL,       -- zenn, qiita, note, x, reddit
  url TEXT NOT NULL,            -- 投稿URL
  posted_at TEXT,               -- 投稿日時
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### engagements テーブル
```sql
CREATE TABLE engagements (
  id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL,
  date TEXT NOT NULL,           -- 取得日（YYYY-MM-DD）
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,     -- RT, ストックなど
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  UNIQUE(post_id, date)
);
```

### github_stats テーブル
```sql
CREATE TABLE github_stats (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  issues INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(project_id, date)
);
```

## API エンドポイント

### 公開API（認証不要）
- `GET /api/projects` - プロジェクト一覧
- `GET /api/projects/:id` - プロジェクト詳細
- `GET /api/projects/:id/engagements` - エンゲージメント履歴

### 管理API（認証必要）
- `POST /api/projects` - プロジェクト追加
- `POST /api/posts` - 投稿追加
- `PUT /api/posts/:id` - 投稿編集
- `DELETE /api/posts/:id` - 投稿削除

## ディレクトリ構成

```
open-sen/
├── api/                    # Cloudflare Worker (Hono)
│   ├── src/
│   │   ├── index.ts        # メインエントリ
│   │   ├── routes/         # APIルート
│   │   ├── cron/           # 定期実行処理
│   │   └── scrapers/       # 各サービスのスクレイパー
│   ├── wrangler.toml       # Worker設定
│   └── package.json
├── web/                    # フロントエンド（Astro + React）
│   ├── src/
│   ├── public/
│   └── package.json
├── schema.sql              # D1スキーマ
├── CLAUDE.md               # このファイル
└── README.md
```

## 開発手順

1. `wrangler` CLIをインストール
2. D1データベースを作成
3. Workerを実装
4. フロントエンドを実装
5. Cloudflare Accessを設定

## 将来の拡張

- 複数ユーザー対応
- 投稿予約機能
- 通知機能（急にバズった時）
- 埋め込みウィジェット
