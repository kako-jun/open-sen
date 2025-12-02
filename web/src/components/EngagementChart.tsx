import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Project, EngagementData } from '../types';
import { API_BASE } from '../utils/api';
import { getPlatformConfig } from '../utils/platformConfig';
import { shortenOwnerId, shortenUrl } from '../utils/stringUtils';
import PlatformBadge from './PlatformBadge';
import { StarsBadge, ForksBadge, LikesBadge, CommentsBadge, SharesBadge } from './StatBadge';

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
            {shortenOwnerId(project.owner_id)}
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
                <StarsBadge value={latestGithub.stars} />
                <ForksBadge value={latestGithub.forks} />
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

      {/* Posts - Section Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
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
          backdropFilter: 'blur(8px)',
        }}>
          {project.posts?.length || 0}
        </span>
      </div>

      {/* Post Cards - Grid layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '8px',
      }}>
        {project.posts && project.posts.length > 0 ? (
          project.posts.map((post) => {
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
              <div key={post.id} className="card" style={{ padding: 0 }}>
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
                  <PlatformBadge platform={post.platform} size="medium" />
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
                      <LikesBadge value={latestEngagement.likes} />
                      <CommentsBadge value={latestEngagement.comments} />
                      <SharesBadge value={latestEngagement.shares} />
                    </div>
                  )}
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', flexShrink: 0 }}>
                    投稿 {post.posted_at.split('T')[0]}
                  </span>
                </a>
                {/* Engagement chart */}
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
          <div className="card" style={{ padding: '20px 12px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
              まだ投稿がありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
