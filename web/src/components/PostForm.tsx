import { useState } from 'react';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface PostFormProps {
  projectId: string;
  onSuccess?: () => void;
}

// Platform support status (auto-fetch = engagement data can be fetched automatically)
const PLATFORMS = [
  { value: 'zenn', label: 'Zenn', color: '#3ea8ff', autoFetch: true },
  { value: 'qiita', label: 'Qiita', color: '#55c500', autoFetch: true },
  { value: 'note', label: 'Note', color: '#41c9b4', autoFetch: true },
  { value: 'reddit', label: 'Reddit', color: '#ff4500', autoFetch: true },
  { value: 'x', label: 'X (Twitter)', color: '#000000', autoFetch: false }, // Requires paid API
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

  const inputStyle = {
    padding: '0.5rem',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.25rem',
    color: '#f8fafc',
    fontSize: '0.875rem',
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      {error && (
        <div
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: '#14532d',
            color: '#bbf7d0',
            padding: '0.5rem',
            borderRadius: '0.25rem',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          Post added successfully!
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label
            style={{ display: 'block', marginBottom: '0.25rem', color: '#94a3b8', fontSize: '0.75rem' }}
          >
            Platform
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            style={{ ...inputStyle, minWidth: '140px' }}
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}{!p.autoFetch ? ' (手動)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '200px' }}>
          <label
            style={{ display: 'block', marginBottom: '0.25rem', color: '#94a3b8', fontSize: '0.75rem' }}
          >
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
          style={{
            background: loading ? '#475569' : '#10b981',
            color: 'white',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '0.25rem',
            fontSize: '0.875rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Adding...' : 'Add Post'}
        </button>
      </div>
    </form>
  );
}
