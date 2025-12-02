import { useState } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

// Get JWT from cookie
function getAuthToken(): string | null {
  const match = document.cookie.match(/CF_Authorization=([^;]+)/);
  return match ? match[1] : null;
}

export default function ProjectForm() {
  const [name, setName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError('Not authenticated. Please sign in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, github_url: githubUrl || null }),
      });

      if (!res.ok) {
        throw new Error('Failed to create project');
      }

      const data = await res.json();
      window.location.href = `/projects/${data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '5px 12px',
    fontSize: '14px',
    lineHeight: '20px',
    color: '#e6edf3',
    background: '#0d1117',
    border: '1px solid #30363d',
    borderRadius: '6px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 600,
    fontSize: '14px',
    color: '#e6edf3',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{
          background: '#490202',
          border: '1px solid #f85149',
          color: '#f85149',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
        padding: '16px',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            Project name <span style={{ color: '#f85149' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., chunkundo.nvim"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = '#58a6ff'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#30363d'}
          />
          <p style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px' }}>
            プロモーションするプロジェクトやお店の名前
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>GitHub URL</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = '#58a6ff'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#30363d'}
          />
          <p style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px' }}>
            GitHubリポジトリがあれば、Star数などを自動取得します
          </p>
        </div>

        <div style={{
          borderTop: '1px solid #30363d',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
          <a
            href="/projects"
            className="btn"
            style={{ textDecoration: 'none' }}
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creating...' : 'Create project'}
          </button>
        </div>
      </div>
    </form>
  );
}
