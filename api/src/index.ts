import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { fetchGitHubStats, fetchEngagement } from './scrapers'
import { authMiddleware, requireAuth } from './middleware/auth'
import { getOwnedProject, getOwnedPost, getTodayDate, buildUpdateQuery } from './utils/db'
import type { Bindings, Variables, Project, Post } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS設定
app.use('/*', cors({
  origin: ['https://open-sen.llll-ll.com', 'http://localhost:4321'],
  credentials: true,
}))

// 認証ミドルウェア
app.use('/*', authMiddleware)

// ヘルスチェック
app.get('/', (c) => {
  return c.json({ status: 'ok', name: 'open-sen' })
})

// ========================================
// Users
// ========================================

// ユーザー情報取得
app.get('/api/users/:ownerId', async (c) => {
  const ownerId = c.req.param('ownerId')
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(ownerId).first()

  if (!user) {
    return c.json({ id: ownerId, bio: null, url: null })
  }
  return c.json(user)
})

// ユーザー情報更新（認証必須 + 本人のみ）
app.patch('/api/users/:ownerId', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const ownerId = c.req.param('ownerId')

  if (userId !== ownerId) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { bio, url } = await c.req.json()

  await c.env.DB.prepare(`
    INSERT INTO users (id, bio, url, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      bio = COALESCE(excluded.bio, bio),
      url = COALESCE(excluded.url, url),
      updated_at = CURRENT_TIMESTAMP
  `).bind(ownerId, bio ?? null, url ?? null).run()

  return c.json({ success: true })
})

// ユーザー別プロジェクト一覧
app.get('/api/users/:ownerId/projects', async (c) => {
  const ownerId = c.req.param('ownerId')
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC'
  ).bind(ownerId).all()
  return c.json(results)
})

// ========================================
// Projects
// ========================================

// 全プロジェクト一覧（新着順）
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
  ).bind(id).first() as Project | null

  if (!project) {
    return c.json({ error: 'Not found' }, 404)
  }

  const { results: posts } = await c.env.DB.prepare(
    'SELECT * FROM posts WHERE project_id = ? ORDER BY posted_at DESC'
  ).bind(id).all()

  return c.json({ ...project, posts })
})

// プロジェクトのエンゲージメント履歴
app.get('/api/projects/:id/engagements', async (c) => {
  const id = c.req.param('id')

  const project = await c.env.DB.prepare(
    'SELECT id FROM projects WHERE id = ?'
  ).bind(id).first()

  if (!project) {
    return c.json({ error: 'Not found' }, 404)
  }

  const { results: githubStats } = await c.env.DB.prepare(`
    SELECT date, stars, forks, issues
    FROM github_stats
    WHERE project_id = ?
    ORDER BY date ASC
  `).bind(id).all()

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
  const userId = c.get('userId')!
  const { name, description, url, github_url } = await c.req.json()

  const result = await c.env.DB.prepare(
    'INSERT INTO projects (owner_id, name, description, url, github_url) VALUES (?, ?, ?, ?, ?)'
  ).bind(userId, name, description ?? null, url ?? null, github_url ?? null).run()

  const projectId = result.meta.last_row_id

  // GitHub URLがあれば即座にstatsを取得
  let githubStats = null
  if (github_url) {
    const today = getTodayDate()
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

// プロジェクト情報更新（認証必須 + 所有者のみ）
app.patch('/api/projects/:id', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')

  const project = await getOwnedProject(c.env.DB, id, userId)
  if (!project) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { name, description, url, github_url } = await c.req.json()
  const [query, values] = buildUpdateQuery(
    'projects',
    { name, description, url, github_url },
    'id',
    id
  )

  if (query) {
    await c.env.DB.prepare(query).bind(...values).run()
  }

  return c.json({ success: true })
})

// プロジェクト公開設定の切り替え（認証必須 + 所有者のみ）
app.patch('/api/projects/:id/visibility', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const id = c.req.param('id')

  const project = await getOwnedProject(c.env.DB, id, userId)
  if (!project) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const { is_public } = await c.req.json()

  await c.env.DB.prepare(
    'UPDATE projects SET is_public = ? WHERE id = ?'
  ).bind(is_public ? 1 : 0, id).run()

  return c.json({ success: true, is_public: !!is_public })
})

// ========================================
// Posts
// ========================================

// 投稿追加（認証必須 + プロジェクト所有者チェック）
app.post('/api/posts', requireAuth, async (c) => {
  const userId = c.get('userId')!
  const { project_id, platform, url, posted_at } = await c.req.json()

  const project = await getOwnedProject(c.env.DB, project_id, userId)
  if (!project) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const actualPostedAt = posted_at || new Date().toISOString()

  const result = await c.env.DB.prepare(
    'INSERT INTO posts (project_id, platform, url, posted_at) VALUES (?, ?, ?, ?)'
  ).bind(project_id, platform, url, actualPostedAt).run()

  const postId = result.meta.last_row_id

  // 即座にエンゲージメント取得
  const today = getTodayDate()
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
  const userId = c.get('userId')!
  const id = c.req.param('id')

  const post = await getOwnedPost(c.env.DB, id, userId)
  if (!post) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM engagements WHERE post_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

// ========================================
// Cron: エンゲージメント取得（1日1回）
// ========================================

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('Cron triggered:', event.cron)
    const today = getTodayDate()

    const { results: projects } = await env.DB.prepare(
      'SELECT * FROM projects'
    ).all() as { results: Project[] }

    for (const project of projects) {
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
      ).bind(project.id).all() as { results: Post[] }

      for (const post of posts) {
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
