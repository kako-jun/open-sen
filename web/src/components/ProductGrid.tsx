import { useState, useEffect, useRef, useCallback } from 'react';
import type { Project, PostEngagement } from '../types';
import { API_BASE } from '../utils/api';
import { getPlatformConfig } from '../utils/platformConfig';
import { shortenOwnerId, shortenUrl } from '../utils/stringUtils';
import MiniChart from './MiniChart';
import PlatformBadge from './PlatformBadge';

interface ProductGridProps {
  ownerId?: string;
  limit?: number;
  infiniteScroll?: boolean;
}

const ITEMS_PER_PAGE = 12;

export default function ProductGrid({ ownerId, limit, infiniteScroll = false }: ProductGridProps) {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // 追加読み込み
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const currentCount = displayedProjects.length;
    const nextProjects = allProjects.slice(currentCount, currentCount + ITEMS_PER_PAGE);

    if (nextProjects.length > 0) {
      setDisplayedProjects(prev => [...prev, ...nextProjects]);
    }

    if (currentCount + nextProjects.length >= allProjects.length) {
      setHasMore(false);
    }

    setLoadingMore(false);
  }, [allProjects, displayedProjects.length, hasMore, loadingMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!infiniteScroll || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [infiniteScroll, hasMore, loadingMore, loadMore]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        let url = `${API_BASE}/api/projects`;
        if (ownerId) {
          url = `${API_BASE}/api/users/${ownerId}/projects`;
        }

        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();

        // 各プロジェクトの詳細（投稿・エンゲージメント含む）を並列取得
        const projectsWithDetails = await Promise.all(
          data.map(async (p: Project) => {
            try {
              const [detailRes, engagementRes] = await Promise.all([
                fetch(`${API_BASE}/api/projects/${p.id}`, { credentials: 'include' }),
                fetch(`${API_BASE}/api/projects/${p.id}/engagements`, { credentials: 'include' }),
              ]);
              const detail = await detailRes.json();
              const engagement = await engagementRes.json();
              return { ...detail, github: engagement.github, postEngagements: engagement.posts };
            } catch {
              return p;
            }
          })
        );

        // 最終投稿日順にソート（新しい順）
        const sortedProjects = projectsWithDetails.sort((a, b) => {
          const getLatestDate = (p: Project) => {
            if (!p.posts || p.posts.length === 0) return new Date(p.created_at).getTime();
            return Math.max(...p.posts.map(post => new Date(post.posted_at).getTime()));
          };
          return getLatestDate(b) - getLatestDate(a);
        });

        // Apply limit if specified (non-infinite mode)
        if (limit && !infiniteScroll) {
          setAllProjects(sortedProjects.slice(0, limit));
          setDisplayedProjects(sortedProjects.slice(0, limit));
          setHasMore(false);
        } else {
          setAllProjects(sortedProjects);
          // 初回表示分
          const initialProjects = sortedProjects.slice(0, ITEMS_PER_PAGE);
          setDisplayedProjects(initialProjects);
          setHasMore(sortedProjects.length > ITEMS_PER_PAGE);
        }
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchProjects();
  }, [ownerId, limit, infiniteScroll]);

  const projects = displayedProjects;

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '8px', fontSize: '12px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--accent-secondary)', padding: '8px', fontSize: '12px' }}>Error: {error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
        <i className="fa-solid fa-baseball" style={{ fontSize: '40px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}></i>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', margin: '0 0 6px' }}>
          まだ打席に立っていません
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          プロダクトを登録してプロモーション活動を始めよう！
        </p>
      </div>
    );
  }

  // 投稿のエンゲージメント履歴からミニグラフ用データを取得
  const getPostEngagementHistory = (project: Project, postUrl: string) => {
    const engagements = project.postEngagements?.filter((e: PostEngagement) => e.url === postUrl) || [];
    return engagements.map((e: PostEngagement) => e.likes + e.comments);
  };

  // 投稿の最新エンゲージメントを取得
  const getLatestEngagement = (project: Project, postUrl: string) => {
    const engagements = project.postEngagements?.filter((e: PostEngagement) => e.url === postUrl) || [];
    return engagements[engagements.length - 1];
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '4px',
    }}>
      {projects.map((project) => {
        const latestStars = project.github?.[project.github.length - 1]?.stars;
        const starHistory = project.github?.map(g => g.stars) || [];

        return (
          <div
            key={project.id}
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Product header */}
            <a
              href={`/projects/${project.id}`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderBottom: '1px solid var(--border-color)',
                textDecoration: 'none',
                background: 'var(--glass-bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: project.description ? '4px' : 0 }}>
                <a
                  href={`/users/${project.owner_id}`}
                  style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', lineHeight: 1 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {shortenOwnerId(project.owner_id)}
                </a>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1 }}>/</span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--link-color)', flex: 1, lineHeight: 1 }}>
                  {project.name}
                </span>
                {project.posts && project.posts.length > 0 && (
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {new Date(
                      Math.max(...project.posts.map(p => new Date(p.posted_at).getTime()))
                    ).toISOString().split('T')[0]}
                  </span>
                )}
              </div>
              {project.description && (
                <p style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {project.description}
                </p>
              )}
            </a>

            {/* GitHub stats row (if exists) */}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderBottom: '1px solid var(--border-color)',
                  textDecoration: 'none',
                  fontSize: '10px',
                }}
              >
                <PlatformBadge platform="github" size="small" />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                  {project.github_url.replace('https://github.com/', '')}
                </span>
                {latestStars !== undefined && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-primary)' }}>
                    <i className="fa-solid fa-star" style={{ fontSize: '9px', color: '#e3b341' }}></i>
                    {latestStars}
                  </span>
                )}
                {starHistory.length >= 2 && (
                  <MiniChart data={starHistory} color="#e3b341" />
                )}
              </a>
            )}

            {/* Posts list - all posts with engagement */}
            <div style={{ flex: 1 }}>
              {project.posts && project.posts.length > 0 ? (
                project.posts.map((post, index) => {
                  const engagementHistory = getPostEngagementHistory(project, post.url);
                  const latestEngagement = getLatestEngagement(project, post.url);
                  const totalEngagement = latestEngagement ? latestEngagement.likes + latestEngagement.comments : 0;

                  return (
                    <a
                      key={post.id}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 10px',
                        borderBottom: index < project.posts!.length - 1 ? '1px solid var(--border-color)' : 'none',
                        textDecoration: 'none',
                        fontSize: '10px',
                      }}
                    >
                      <PlatformBadge platform={post.platform} size="small" />
                      <span style={{
                        color: 'var(--text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}>
                        {shortenUrl(post.url)}
                      </span>
                      {totalEngagement > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-primary)', flexShrink: 0 }}>
                          <i className="fa-solid fa-heart" style={{ fontSize: '9px', color: '#f43f5e' }}></i>
                          {totalEngagement}
                        </span>
                      )}
                      {engagementHistory.length >= 2 && (
                        <MiniChart data={engagementHistory} color="#f43f5e" />
                      )}
                    </a>
                  );
                })
              ) : (
                <div style={{
                  padding: '12px 10px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                }}>
                  投稿なし
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Infinite scroll trigger */}
      {infiniteScroll && (
        <div ref={loadMoreRef} style={{ padding: '20px', textAlign: 'center' }}>
          {loadingMore && (
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>
              読み込み中...
            </span>
          )}
          {!hasMore && allProjects.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: '24px', color: 'var(--accent-primary)' }}></i>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                すべてのプロジェクトを表示しました
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
