import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchGitHubStats, fetchEngagement } from './scrapers'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('/*', cors())

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', name: 'open-sen' })
})

// プロジェクト一覧
app.get('/api/projects', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects ORDER BY created_at DESC'
  ).all()
  return c.json(results)
})

// プロジェクト詳細
app.get('/api/projects/:id', async (c) => {
  const id = c.req.param('id')
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(id).first()

  if (!project) {
    return c.json({ error: 'Not found' }, 404)
  }

  // 関連する投稿も取得
  const { results: posts } = await c.env.DB.prepare(
    'SELECT * FROM posts WHERE project_id = ? ORDER BY posted_at DESC'
  ).bind(id).all()

  return c.json({ ...project, posts })
})

// プロジェクトのエンゲージメント履歴
app.get('/api/projects/:id/engagements', async (c) => {
  const id = c.req.param('id')

  // GitHub stats
  const { results: githubStats } = await c.env.DB.prepare(`
    SELECT date, stars, forks, issues
    FROM github_stats
    WHERE project_id = ?
    ORDER BY date ASC
  `).bind(id).all()

  // 各投稿のエンゲージメント
  const { results: postEngagements } = await c.env.DB.prepare(`
    SELECT p.platform, p.url, e.date, e.likes, e.comments, e.shares
    FROM posts p
    JOIN engagements e ON p.id = e.post_id
    WHERE p.project_id = ?
    ORDER BY e.date ASC
  `).bind(id).all()

  return c.json({ github: githubStats, posts: postEngagements })
})

// プロジェクト追加（要認証）
app.post('/api/projects', async (c) => {
  const { name, github_url } = await c.req.json()

  const result = await c.env.DB.prepare(
    'INSERT INTO projects (name, github_url) VALUES (?, ?)'
  ).bind(name, github_url).run()

  return c.json({ id: result.meta.last_row_id, name, github_url }, 201)
})

// 投稿追加（要認証）
app.post('/api/posts', async (c) => {
  const { project_id, platform, url, posted_at } = await c.req.json()
  const actualPostedAt = posted_at || new Date().toISOString()

  const result = await c.env.DB.prepare(
    'INSERT INTO posts (project_id, platform, url, posted_at) VALUES (?, ?, ?, ?)'
  ).bind(project_id, platform, url, actualPostedAt).run()

  return c.json({ id: result.meta.last_row_id }, 201)
})

// 投稿削除（要認証）
app.delete('/api/posts/:id', async (c) => {
  const id = c.req.param('id')

  await c.env.DB.prepare('DELETE FROM engagements WHERE post_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// Cron: エンゲージメント取得（1日1回）
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('Cron triggered:', event.cron)
    const today = new Date().toISOString().split('T')[0]

    // 全プロジェクトを取得
    const { results: projects } = await env.DB.prepare(
      'SELECT * FROM projects'
    ).all()

    for (const project of projects as any[]) {
      // GitHub statsを取得
      if (project.github_url) {
        const stats = await fetchGitHubStats(project.github_url)
        if (stats) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO github_stats (project_id, date, stars, forks, issues)
            VALUES (?, ?, ?, ?, ?)
          `).bind(project.id, today, stats.stars, stats.forks, stats.issues).run()
        }
      }

      // 各投稿のエンゲージメントを取得
      const { results: posts } = await env.DB.prepare(
        'SELECT * FROM posts WHERE project_id = ?'
      ).bind(project.id).all()

      for (const post of posts as any[]) {
        const engagement = await fetchEngagement(post.platform, post.url)
        if (engagement) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO engagements (post_id, date, likes, comments, shares)
            VALUES (?, ?, ?, ?, ?)
          `).bind(post.id, today, engagement.likes, engagement.comments, engagement.shares).run()
        }
      }
    }

    console.log('Engagement fetch completed')
  },
}
