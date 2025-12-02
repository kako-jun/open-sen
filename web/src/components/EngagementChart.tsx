import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface Project {
  id: number;
  name: string;
  owner_id: string;
  github_url: string | null;
  posts: Post[];
}

interface Post {
  id: number;
  platform: string;
  url: string;
  posted_at: string;
}

interface GithubStat {
  date: string;
  stars: number;
  forks: number;
  issues: number;
}

interface PostEngagement {
  platform: string;
  url: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

interface EngagementData {
  github: GithubStat[];
  posts: PostEngagement[];
}


// GitHub-like icons using Font Awesome
const StarIcon = () => (
  <i className="fa-solid fa-star" style={{ fontSize: '12px', color: '#e3b341' }}></i>
);

const ForkIcon = () => (
  <i className="fa-solid fa-code-fork" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}></i>
);

// グラフの色を傾向で決定（上昇:緑、下降:青、横ばい:グレー）
function getTrendColor(data: number[]): string {
  if (!data || data.length < 2) return 'var(--text-muted)';
  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const threshold = Math.max(first * 0.05, 1); // 5%以上の変化で傾向判定
  if (diff > threshold) return '#22c55e'; // 上昇 - 緑
  if (diff < -threshold) return '#3b82f6'; // 下降 - 青
  return '#8b949e'; // 横ばい - グレー
}

// Mini sparkline chart (SVG) - same as ProductGrid
function MiniChart({ data, color }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;

  const chartColor = color || getTrendColor(data);
  const width = 60;
  const height = 20;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'block', flexShrink: 0 }}>
      <polyline
        points={points}
        fill="none"
        stroke={chartColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// URL短縮表示
const shortenUrl = (url: string) => {
  try {
    const u = new URL(url);
    const path = u.pathname.length > 30 ? u.pathname.substring(0, 30) + '…' : u.pathname;
    return u.hostname + path;
  } catch {
    return url.length > 40 ? url.substring(0, 40) + '…' : url;
  }
};

export default function EngagementChart({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [engagements, setEngagements] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/projects/${projectId}`, { credentials: 'include' }).then((res) => res.json()),
      fetch(`${API_BASE}/api/projects/${projectId}/engagements`, { credentials: 'include' }).then((res) => res.json()),
    ])
      .then(([projectData, engagementData]) => {
        setProject(projectData);
        setEngagements(engagementData);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '12px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--accent-secondary)', padding: '12px' }}>Error: {error}</div>;
  }

  if (!project) {
    return <div style={{ color: 'var(--accent-secondary)', padding: '12px' }}>Project not found</div>;
  }

  const latestGithub = engagements?.github?.[engagements.github.length - 1];

  return (
    <div>
      {/* Project Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px' }}>
          <a
            href={`/users/${project.owner_id}`}
            style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500 }}
          >
            {project.owner_id.substring(0, 8)}
          </a>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {project.name}
          </span>
        </div>
      </div>

      {/* GitHub Section - only shown if github_url exists */}
      {project.github_url && (
        <div className="card" style={{ marginBottom: '12px', padding: 0 }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-brands fa-github" style={{ fontSize: '16px', color: 'var(--text-primary)' }}></i>
            <a
              href={project.github_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--link-color)', fontSize: '13px', flex: 1 }}
            >
              {project.github_url.replace('https://github.com/', '')}
            </a>
            {latestGithub && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px' }}>
                  <StarIcon />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{latestGithub.stars}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px' }}>
                  <ForkIcon />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{latestGithub.forks}</span>
                </div>
              </div>
            )}
          </div>
          {engagements?.github && engagements.github.length > 1 && (
            <div style={{ padding: '12px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={engagements.github}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                  <YAxis stroke="var(--text-secondary)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '11px',
                    }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line type="monotone" dataKey="stars" stroke="#e3b341" name="Stars" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="forks" stroke="var(--text-secondary)" name="Forks" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Posts */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            スイング記録
          </h2>
          <span style={{
            background: 'var(--btn-bg)',
            color: 'var(--text-primary)',
            padding: '0 6px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 600,
          }}>
            {project.posts?.length || 0}
          </span>
        </div>
        <div>
          {project.posts && project.posts.length > 0 ? (
            project.posts.map((post, index) => {
              // 該当投稿の最新エンゲージメントを取得
              const postEngagements = engagements?.posts?.filter(e => e.url === post.url) || [];
              const latestEngagement = postEngagements[postEngagements.length - 1];

              // グラフ用データを作成
              const chartData = postEngagements.map(e => ({
                date: e.date,
                likes: e.likes,
                comments: e.comments,
                shares: e.shares,
              }));

              return (
                <div
                  key={post.id}
                  style={{
                    borderBottom: index < project.posts.length - 1 ? '1px solid var(--border-color)' : 'none',
                  }}
                >
                  {/* Post header */}
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      textDecoration: 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--glass-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{
                      background: getPlatformConfig(post.platform).color,
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className={getPlatformConfig(post.platform).icon} style={{ fontSize: '12px' }}></i>
                    </span>
                    <span style={{
                      color: 'var(--link-color)',
                      fontSize: '12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}>
                      {shortenUrl(post.url)}
                    </span>
                    {latestEngagement && (
                      <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                        {latestEngagement.likes > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-heart" style={{ color: '#f43f5e', fontSize: '10px' }}></i>
                            {latestEngagement.likes}
                          </span>
                        )}
                        {latestEngagement.comments > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-comment" style={{ fontSize: '10px' }}></i>
                            {latestEngagement.comments}
                          </span>
                        )}
                        {latestEngagement.shares > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                            <i className="fa-solid fa-share" style={{ fontSize: '10px' }}></i>
                            {latestEngagement.shares}
                          </span>
                        )}
                      </div>
                    )}
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>
                      投稿 {post.posted_at.split('T')[0]}
                    </span>
                  </a>
                  {/* Engagement chart - same size as GitHub */}
                  {chartData.length > 1 && (
                    <div style={{ padding: '0 12px 12px' }}>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} />
                          <YAxis stroke="var(--text-secondary)" fontSize={10} />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              fontSize: '11px',
                            }}
                            labelStyle={{ color: 'var(--text-primary)' }}
                          />
                          <Line type="monotone" dataKey="likes" stroke="#f43f5e" name="Likes" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="comments" stroke="#3b82f6" name="Comments" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '20px 12px', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                まだ投稿がありません
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Platform config (color + Font Awesome icon class)
const platformConfig: Record<string, { color: string; icon: string }> = {
  zenn: { color: '#3ea8ff', icon: 'fa-solid fa-z' },
  qiita: { color: '#55c500', icon: 'fa-solid fa-q' },
  reddit: { color: '#ff4500', icon: 'fa-brands fa-reddit-alien' },
  github: { color: '#333333', icon: 'fa-brands fa-github' },
  note: { color: '#41c9b4', icon: 'fa-solid fa-n' },
  x: { color: '#000000', icon: 'fa-brands fa-x-twitter' },
  instagram: { color: '#e4405f', icon: 'fa-brands fa-instagram' },
  youtube: { color: '#ff0000', icon: 'fa-brands fa-youtube' },
  tiktok: { color: '#000000', icon: 'fa-brands fa-tiktok' },
  facebook: { color: '#1877f2', icon: 'fa-brands fa-facebook' },
  threads: { color: '#000000', icon: 'fa-brands fa-threads' },
};

function getPlatformConfig(platform: string) {
  return platformConfig[platform] || { color: '#6e7681', icon: 'fa-solid fa-link' };
}
