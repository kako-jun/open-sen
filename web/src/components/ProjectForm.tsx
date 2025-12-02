import { useState } from 'react';
import { API_BASE, getAuthToken } from '../utils/api';

export default function ProjectForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
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
        body: JSON.stringify({
          name,
          description: description || null,
          url: url || null,
          github_url: githubUrl || null,
        }),
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
    padding: '4px 10px',
    fontSize: '14px',
    lineHeight: '20px',
    color: 'var(--text-primary)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 600,
    fontSize: '13px',
    color: 'var(--text-primary)',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      {error && (
        <div style={{
          background: 'rgba(248, 81, 73, 0.1)',
          border: '1px solid var(--accent-secondary)',
          color: 'var(--accent-secondary)',
          padding: '10px 12px',
          borderRadius: '6px',
          marginBottom: '12px',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>
            Project name <span style={{ color: 'var(--accent-secondary)' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., chunkundo.nvim"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--link-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
            プロモーションするプロジェクトやお店の名前
          </p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>一言紹介</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Neovimの変更履歴をチャンク単位で管理するプラグイン"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--link-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
            プロジェクトの簡単な説明
          </p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>公式サイトURL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--link-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
            プロジェクトの公式サイトやランディングページのURL
          </p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>GitHub URL</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--link-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
          />
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
            GitHubリポジトリがあれば、Star数などを自動取得します
          </p>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
        }}>
          <a href="/projects" className="btn" style={{ textDecoration: 'none' }}>
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
