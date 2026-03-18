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
import { API_BASE, createAuthHeaders } from '../utils/api';
import { getPlatformConfig } from '../utils/platformConfig';
import { shortenOwnerId, shortenUrl } from '../utils/stringUtils';
import PlatformBadge from './PlatformBadge';
import { StarsBadge, ForksBadge, LikesBadge, CommentsBadge, SharesBadge } from './StatBadge';

export default function EngagementChart({ projectId }: { projectId: string; }) {
  const [project, setProject] = useState<Project | null>(null);
  const [engagements, setEngagements] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    const authHeaders = createAuthHeaders();
    Promise.all([
      fetch(`${API_BASE}/api/projects/${projectId}`, { credentials: 'include', headers: authHeaders }).then((res) => res.json()),
      fetch(`${API_BASE}/api/projects/${projectId}/engagements`, { credentials: 'include', headers: authHeaders }).then((res) => res.json()),
    ])
      .then(([projectData, engagementData]) => {
        setProject(projectData);
        setEngagements(engagementData);
        setLoading(false);
        // owner_name is returned by API via JOIN
        if (projectData.owner_name) setOwnerName(projectData.owner_name);
        // Check ownership via JWT cookie
        try {
          const cookie = document.cookie.match(/CF_Authorization=([^;]+)/)?.[1];
          if (cookie) {
            const payload = JSON.parse(atob(cookie.split('.')[1]));
            if (payload.email) {
              const enc = new TextEncoder();
              crypto.subtle.digest('SHA-256', enc.encode(payload.email.toLowerCase())).then(buf => {
                const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
                setIsOwner(hash === projectData.owner_id);
              });
            }
          }
        } catch {}
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
            {ownerName || shortenOwnerId(project.owner_id)}
          </a>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {project.name}
          </span>
        </div>
        {project.description && (
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            margin: '6px 0 0',
            lineHeight: 1.5,
          }}>
            {project.description}
          </p>
        )}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: 'var(--link-color)',
              marginTop: '6px',
            }}
          >
            <i className="fa-solid fa-link" style={{ fontSize: '10px' }}></i>
            {project.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        )}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(184, 255, 87, 0.1)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tick={{ fill: 'var(--text-muted)' }} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} tick={{ fill: 'var(--text-muted)' }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(8, 12, 22, 0.92)',
                      border: '1px solid rgba(184, 255, 87, 0.35)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      backdropFilter: 'blur(12px)',
                    }}
                    labelStyle={{ color: '#b8ff57' }}
                    itemStyle={{ color: '#e8f5d0' }}
                  />
                  <Line type="monotone" dataKey="stars" stroke="#b8ff57" name="Stars" strokeWidth={2.5} dot={false}
                    style={{ filter: 'drop-shadow(0 0 5px rgba(184, 255, 87, 0.8))' }} />
                  <Line type="monotone" dataKey="forks" stroke="#ff6b9d" name="Forks" strokeWidth={2} dot={false}
                    style={{ filter: 'drop-shadow(0 0 5px rgba(255, 107, 157, 0.8))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Posts - Section Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '20px',
        marginBottom: '8px',
      }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
          スイング記録
        </h2>
        <span style={{
          background: 'var(--btn-bg)',
          color: 'var(--text-primary)',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 600,
          lineHeight: 1,
          backdropFilter: 'blur(8px)',
        }}>
          {project.posts?.length || 0}
        </span>
      </div>

      {/* Post Cards - Grid layout (wider cards than product grid) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))',
        gap: '8px',
      }}>
        {project.posts && project.posts.length > 0 ? (
          project.posts.map((post) => {
            // 該当投稿の最新エンゲージメントを取得（post_id で照合してURL揺れを回避）
            const postEngagements = engagements?.posts?.filter(e => e.post_id === post.id) || [];
            const latestEngagement = postEngagements[postEngagements.length - 1];

            // グラフ用データを作成
            const chartData = postEngagements.map(e => ({
              date: e.date,
              likes: e.likes,
              comments: e.comments,
              shares: e.shares,
            }));

            const handleDeletePost = async (postId: number) => {
              if (!confirm('この投稿を削除しますか？')) return;
              const authHeaders = createAuthHeaders();
              const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeaders,
              });
              if (res.ok) {
                setProject(prev => prev ? { ...prev, posts: prev.posts?.filter(p => p.id !== postId) } : prev);
              }
            };

            return (
              <div key={post.id} className="card" style={{ padding: 0, position: 'relative' }}>
                {isOwner && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      padding: '2px 4px',
                      zIndex: 1,
                      opacity: 0.6,
                    }}
                    title="投稿を削除"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
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
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(184, 255, 87, 0.08)" />
                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tick={{ fill: 'var(--text-muted)' }} />
                        <YAxis stroke="var(--text-muted)" fontSize={10} tick={{ fill: 'var(--text-muted)' }} />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(8, 12, 22, 0.92)',
                            border: '1px solid rgba(255, 107, 157, 0.35)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            backdropFilter: 'blur(12px)',
                          }}
                          labelStyle={{ color: '#ff6b9d' }}
                          itemStyle={{ color: '#e8f5d0' }}
                        />
                        <Line type="monotone" dataKey="likes" stroke="#ff6b9d" name="Likes" strokeWidth={2.5} dot={false}
                          style={{ filter: 'drop-shadow(0 0 5px rgba(255, 107, 157, 0.8))' }} />
                        <Line type="monotone" dataKey="comments" stroke="#b8ff57" name="Comments" strokeWidth={2} dot={false}
                          style={{ filter: 'drop-shadow(0 0 4px rgba(184, 255, 87, 0.7))' }} />
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
