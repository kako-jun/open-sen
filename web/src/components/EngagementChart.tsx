import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';

interface Project {
  id: number;
  name: string;
  github_url: string | null;
  posts: Post[];
}

interface Post {
  id: number;
  platform: string;
  url: string;
  posted_at: string;
}

interface GithubStat {
  date: string;
  stars: number;
  forks: number;
  issues: number;
}

interface PostEngagement {
  platform: string;
  url: string;
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

interface EngagementData {
  github: GithubStat[];
  posts: PostEngagement[];
}

export default function EngagementChart({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [engagements, setEngagements] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/projects/${projectId}`).then((res) => res.json()),
      fetch(`${API_BASE}/api/projects/${projectId}/engagements`).then((res) => res.json()),
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
    return <div style={{ color: '#94a3b8' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#ef4444' }}>Error: {error}</div>;
  }

  if (!project) {
    return <div style={{ color: '#ef4444' }}>Project not found</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.name}</h1>
      {project.github_url && (
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#60a5fa' }}
        >
          {project.github_url}
        </a>
      )}

      {/* GitHub Stars Chart */}
      {engagements?.github && engagements.github.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>GitHub Stars</h2>
          <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagements.github}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Line type="monotone" dataKey="stars" stroke="#fbbf24" name="Stars" />
                <Line type="monotone" dataKey="forks" stroke="#60a5fa" name="Forks" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Posts */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Posts</h2>
        {project.posts && project.posts.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {project.posts.map((post) => (
              <div
                key={post.id}
                style={{ background: '#1e293b', padding: '1rem', borderRadius: '0.5rem' }}
              >
                <span
                  style={{
                    background: getPlatformColor(post.platform),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    marginRight: '0.5rem',
                  }}
                >
                  {post.platform}
                </span>
                <a href={post.url} target="_blank" rel="noopener noreferrer">
                  {post.url}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#94a3b8' }}>No posts yet.</p>
        )}
      </div>
    </div>
  );
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    zenn: '#3ea8ff',
    qiita: '#55c500',
    note: '#41c9b4',
    x: '#000000',
    reddit: '#ff4500',
    github: '#333333',
  };
  return colors[platform] || '#6b7280';
}
