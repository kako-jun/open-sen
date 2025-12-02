import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchGitHubStats, fetchEngagement } from './scrapers'

type Bindings = {
  DB: D1Database
}

type Variables = {
  userId: string | null
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS設定
app.use('/*', cors({
  origin: ['https://open-sen.llll-ll.com', 'http://localhost:4321'],
  credentials: true,
}))

// Cloudflare Access認証ミドルウェア
// Cf-Access-Jwt-Assertion、Authorization Bearer、またはCookieからユーザー情報を取得
app.use('/*', async (c, next) => {
  // ヘッダーからJWTを取得（優先順位: Cf-Access-Jwt-Assertion > Authorization Bearer > Cookie）
  let cfAccessJwt = c.req.header('Cf-Access-Jwt-Assertion')

  if (!cfAccessJwt) {
    // Authorization Bearerヘッダーから取得を試みる
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      cfAccessJwt = authHeader.slice(7)
    }
  }

  if (!cfAccessJwt) {
    // Cookieから取得を試みる
    const cookie = c.req.header('Cookie')
    if (cookie) {
      const match = cookie.match(/CF_Authorization=([^;]+)/)
      if (match) {
        cfAccessJwt = match[1]
      }
    }
  }

  if (cfAccessJwt) {
    try {
      // JWTをデコード（Cloudflare Accessが検証済みなので署名検証は不要）
      const parts = cfAccessJwt.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        // subがユーザーの一意識別子（ハッシュ済み）
        c.set('userId', payload.sub || null)
      }
    } catch {
      c.set('userId', null)
    }
  } else {
    c.set('userId', null)
  }

  await next()
})

// 認証必須のエンドポイント用ミドルウェア
const requireAuth = async (c: any, next: any) => {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', name: 'open-sen' })
})

// プロジェクト一覧
// ログイン時: 自分のプロジェクト
// 未ログイン時: 公開プロジェクトのみ
app.get('/api/projects', async (c) => {
  const userId = c.get('userId')

  if (userId) {
    // ログイン時: 自分のプロジェクト
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC'
    ).bind(userId).all()
    return c.json(results)
  } else {
    // 未ログイン時: 公開プロジェクトのみ
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE is_public = 1 ORDER BY created_at DESC'
    ).all()
    return c.json(results)
  }
})

// プロジェクト詳細（公開 or 自分のプロジェクト）
app.get('/api/projects/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')

  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(id).first() as any

  if (!project) {
    return c.json({ error: 'Not found' }, 404)
  }

  // 公開プロジェクト or 自分のプロジェクトのみアクセス可
  if (!project.is_public && project.owner_id !== userId) {
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
  const userId = c.get('userId')

  // プロジェクトの存在確認とアクセス権チェック
  const project = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(id).first() as any

  if (!project) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (!project.is_public && project.owner_id !== userId) {
    return c.json({ error: 'Not found' }, 404)
  }

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

// プロジェクト追加（認証必須）
app.post('/api/projects', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { name, github_url } = await c.req.json()

  const result = await c.env.DB.prepare(
    'INSERT INTO projects (owner_id, name, github_url) VALUES (?, ?, ?)'
  ).bind(userId, name, github_url).run()

  const projectId = result.meta.last_row_id

  // GitHub URLがあれば即座にstatsを取得
  let githubStats = null
  if (github_url) {
    const today = new Date().toISOString().split('T')[0]
    const stats = await fetchGitHubStats(github_url)
    if (stats) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO github_stats (project_id, date, stars, forks, issues)
        VALUES (?, ?, ?, ?, ?)
      `).bind(projectId, today, stats.stars, stats.forks, stats.issues).run()
      githubStats = stats
    }
  }

  return c.json({ id: projectId, name, github_url, github_stats: githubStats }, 201)
})

// 投稿追加（認証必須 + プロジェクト所有者チェック）
app.post('/api/posts', requireAuth, async (c) => {
  const userId = c.get('userId')
  const { project_id, platform, url, posted_at } = await c.req.json()

  // プロジェクトの所有者チェック
  const project = await c.env.DB.prepare(
    'SELECT owner_id FROM projects WHERE id = ?'
  ).bind(project_id).first() as any

  if (!project || project.owner_id !== userId) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const actualPostedAt = posted_at || new Date().toISOString()

  const result = await c.env.DB.prepare(
    'INSERT INTO posts (project_id, platform, url, posted_at) VALUES (?, ?, ?, ?)'
  ).bind(project_id, platform, url, actualPostedAt).run()

  const postId = result.meta.last_row_id

  // 即座にエンゲージメント取得を実行
  const today = new Date().toISOString().split('T')[0]
  const engagement = await fetchEngagement(platform, url)
  if (engagement) {
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO engagements (post_id, date, likes, comments, shares)
      VALUES (?, ?, ?, ?, ?)
    `).bind(postId, today, engagement.likes, engagement.comments, engagement.shares).run()
  }

  return c.json({ id: postId, engagement }, 201)
})

// 投稿削除（認証必須 + プロジェクト所有者チェック）
app.delete('/api/posts/:id', requireAuth, async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  // 投稿とプロジェクトの所有者チェック
  const post = await c.env.DB.prepare(`
    SELECT p.id, proj.owner_id
    FROM posts p
    JOIN projects proj ON p.project_id = proj.id
    WHERE p.id = ?
  `).bind(id).first() as any

  if (!post || post.owner_id !== userId) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM engagements WHERE post_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// プロジェクト公開設定の切り替え（認証必須）
app.patch('/api/projects/:id/visibility', requireAuth, async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const { is_public } = await c.req.json()

  // プロジェクトの所有者チェック
  const project = await c.env.DB.prepare(
    'SELECT owner_id FROM projects WHERE id = ?'
  ).bind(id).first() as any

  if (!project || project.owner_id !== userId) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.DB.prepare(
    'UPDATE projects SET is_public = ? WHERE id = ?'
  ).bind(is_public ? 1 : 0, id).run()

  return c.json({ success: true, is_public: !!is_public })
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
