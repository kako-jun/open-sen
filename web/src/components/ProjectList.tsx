import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface Project {
  id: number;
  name: string;
  github_url: string | null;
  created_at: string;
}

// GitHub-like repo icon
const RepoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e">
    <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
  </svg>
);

interface ProjectListProps {
  isLoggedIn?: boolean;
}

export default function ProjectList({ isLoggedIn = false }: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: '#8b949e', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#f85149', padding: '16px' }}>Error: {error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 16px',
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
      }}>
        <RepoIcon />
        <h3 style={{ color: '#e6edf3', fontSize: '20px', margin: '16px 0 8px' }}>
          {isLoggedIn ? 'まだプロジェクトがありません' : '公開プロジェクトはありません'}
        </h3>
        {isLoggedIn && (
          <>
            <p style={{ color: '#8b949e', fontSize: '14px', marginBottom: '16px' }}>
              最初のプロジェクトを追加して、プロモーション活動を始めよう！
            </p>
            <a
              href="/projects/new"
              className="btn btn-primary"
              style={{ textDecoration: 'none' }}
            >
              New Project
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      {projects.map((project, index) => (
        <a
          key={project.id}
          href={`/projects/${project.id}`}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            borderBottom: index < projects.length - 1 ? '1px solid #21262d' : 'none',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#1c2128'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <RepoIcon />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#58a6ff',
              }}>
                {project.name}
              </span>
            </div>
            {project.github_url && (
              <p style={{
                color: '#8b949e',
                fontSize: '12px',
                marginTop: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {project.github_url}
              </p>
            )}
            <p style={{ color: '#8b949e', fontSize: '12px', marginTop: '8px' }}>
              Updated {new Date(project.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
