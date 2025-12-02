# open-sen

OSSプロモーション活動を記録・可視化するダッシュボード。

> 野球の「オープン戦」にかけて:
> - **オープン宣伝** - プロモーション状況をオープンに晒す
> - **オープン戦（戦い）** - 有名になれるかの戦いの始まり

## Features

- プロジェクト（OSSツール）の登録
- 投稿先（Zenn, Qiita, Note, X, Reddit）の管理
- エンゲージメント（いいね、コメント数など）の自動取得
- 時系列グラフで推移を可視化
- URLを公開して「こんな感じです」と晒せる

## Tech Stack

- **API**: Cloudflare Workers + Hono
- **DB**: Cloudflare D1
- **Frontend**: Astro + React
- **Hosting**: Cloudflare Pages
- **Auth**: Cloudflare Access

## Development

```bash
# API
cd api
npm install
npm run dev

# Web
cd web
npm install
npm run dev
```

## License

MIT
