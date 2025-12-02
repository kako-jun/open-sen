import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface Project {
  id: number;
  name: string;
  github_url: string | null;
  created_at: string;
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/projects`)
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
    return <div style={{ color: '#94a3b8' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#ef4444' }}>Error: {error}</div>;
  }

  if (projects.length === 0) {
    return (
      <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
        No projects yet. Add your first project!
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {projects.map((project) => (
        <a
          key={project.id}
          href={`/projects/${project.id}`}
          style={{
            display: 'block',
            background: '#1e293b',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#f8fafc' }}>
            {project.name}
          </h3>
          {project.github_url && (
            <p style={{ color: '#60a5fa', fontSize: '0.875rem' }}>{project.github_url}</p>
          )}
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Created: {new Date(project.created_at).toLocaleDateString()}
          </p>
        </a>
      ))}
    </div>
  );
}
