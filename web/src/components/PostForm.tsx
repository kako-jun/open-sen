import { useState } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface PostFormProps {
  projectId: string;
  onSuccess?: () => void;
}

// Platform support status (auto-fetch = engagement data can be fetched automatically)
const PLATFORMS = [
  // Developer-focused platforms
  { value: 'zenn', label: 'Zenn', color: '#3ea8ff', autoFetch: true, category: 'dev' },
  { value: 'qiita', label: 'Qiita', color: '#55c500', autoFetch: true, category: 'dev' },
  { value: 'reddit', label: 'Reddit', color: '#ff4500', autoFetch: true, category: 'dev' },
  // General platforms
  { value: 'note', label: 'Note', color: '#41c9b4', autoFetch: true, category: 'general' },
  { value: 'x', label: 'X (Twitter)', color: '#1d9bf0', autoFetch: false, category: 'general' },
  { value: 'instagram', label: 'Instagram', color: '#e4405f', autoFetch: false, category: 'general' },
  { value: 'youtube', label: 'YouTube', color: '#ff0000', autoFetch: false, category: 'general' },
  { value: 'tiktok', label: 'TikTok', color: '#000000', autoFetch: false, category: 'general' },
  { value: 'facebook', label: 'Facebook', color: '#1877f2', autoFetch: false, category: 'general' },
  { value: 'threads', label: 'Threads', color: '#000000', autoFetch: false, category: 'general' },
  { value: 'other', label: 'Other', color: '#6e7681', autoFetch: false, category: 'other' },
];

export default function PostForm({ projectId, onSuccess }: PostFormProps) {
  const [platform, setPlatform] = useState('zenn');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          project_id: parseInt(projectId),
          platform,
          url,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add post');
      }

      setUrl('');
      setSuccess(true);
      onSuccess?.();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '4px',
    color: 'var(--text-primary)',
    fontSize: '13px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '8px' }}>
      {error && (
        <div style={{
          background: 'rgba(248, 81, 73, 0.1)',
          color: 'var(--accent-secondary)',
          padding: '6px 10px',
          borderRadius: '4px',
          marginBottom: '6px',
          fontSize: '12px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(0, 255, 159, 0.1)',
          color: 'var(--accent-primary)',
          padding: '6px 10px',
          borderRadius: '4px',
          marginBottom: '6px',
          fontSize: '12px',
        }}>
          Post added!
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '2px', color: 'var(--text-secondary)', fontSize: '11px' }}>
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={{ ...inputStyle, minWidth: '120px' }}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}{!p.autoFetch ? ' (手動)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label style={{ display: 'block', marginBottom: '2px', color: 'var(--text-secondary)', fontSize: '11px' }}>
            URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://zenn.dev/..."
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{
            padding: '4px 12px',
            fontSize: '13px',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
}
