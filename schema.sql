-- open-sen D1 Schema

-- プロジェクト（OSSツールなど）
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  github_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 投稿（各プラットフォームへの投稿）
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  platform TEXT NOT NULL,  -- zenn, qiita, note, x, reddit
  url TEXT NOT NULL,
  posted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- エンゲージメント（投稿ごとの日次データ）
CREATE TABLE IF NOT EXISTS engagements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  UNIQUE(post_id, date)
);

-- GitHubスタッツ（プロジェクトごとの日次データ）
CREATE TABLE IF NOT EXISTS github_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  issues INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  UNIQUE(project_id, date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_posts_project ON posts(project_id);
CREATE INDEX IF NOT EXISTS idx_engagements_post ON engagements(post_id);
CREATE INDEX IF NOT EXISTS idx_engagements_date ON engagements(date);
CREATE INDEX IF NOT EXISTS idx_github_stats_project ON github_stats(project_id);
CREATE INDEX IF NOT EXISTS idx_github_stats_date ON github_stats(date);
