import { useState, useEffect } from 'react';
import type { Project } from '../types';
import { API_BASE } from '../utils/api';
import { shortenOwnerId } from '../utils/stringUtils';

// GitHub-like repo icon
const RepoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" style={{ fill: 'var(--text-secondary)' }}>
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
  </svg>
);

interface ProjectListProps {
  isLoggedIn?: boolean;
  showAll?: boolean;  // true: 全プロダクト, false: 自分のプロダクト
  ownerId?: string;   // 特定ユーザーのプロダクト
}

export default function ProjectList({ isLoggedIn = false, showAll = false, ownerId }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let url = `${API_BASE}/api/projects`;
    if (ownerId) {
      url = `${API_BASE}/api/users/${ownerId}/projects`;
    }

    fetch(url, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [ownerId]);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)', padding: '12px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--accent-secondary)', padding: '12px' }}>Error: {error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '32px 12px' }}>
        <RepoIcon />
        <h3 style={{ color: 'var(--text-primary)', fontSize: '18px', margin: '12px 0 6px' }}>
          {showAll ? 'まだプロダクトがありません' : 'まだプロジェクトがありません'}
        </h3>
        {isLoggedIn && !showAll && (
          <>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>
              最初のプロジェクトを追加して、プロモーション活動を始めよう！
            </p>
            <a href="/projects/new" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              New Project
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {projects.map((project, index) => (
        <div
          key={project.id}
          style={{
            padding: '10px 12px',
            borderBottom: index < projects.length - 1 ? '1px solid var(--border-color)' : 'none',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <RepoIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {showAll && (
                <a
                  href={`/users/${project.owner_id}`}
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  {shortenOwnerId(project.owner_id)}
                </a>
              )}
              {showAll && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>/</span>}
              <a
                href={`/projects/${project.id}`}
                style={{ fontSize: '15px', fontWeight: 600, color: 'var(--link-color)' }}
              >
                {project.name}
              </a>
            </div>
            {project.github_url && (
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '11px',
                marginTop: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {project.github_url}
              </p>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
              {new Date(project.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
