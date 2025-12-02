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

// Encouraging messages when engagement is low
const encouragements = [
  "まだ始まったばかり。継続は力なり！",
  "最初の1いいねが来るまでが長いんだ",
  "良いものは必ず見つけてもらえる",
  "今日投稿しなかった人より前にいる",
  "バズらなくても、誰かの役に立ってる",
];

// GitHub-like star icon
const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#e3b341">
    <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
  </svg>
);

const ForkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="#8b949e">
    <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
  </svg>
);

export default function EngagementChart({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [engagements, setEngagements] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/projects/${projectId}`, { credentials: 'include' }).then((res) => res.json()),
      fetch(`${API_BASE}/api/projects/${projectId}/engagements`, { credentials: 'include' }).then((res) => res.json()),
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
    return <div style={{ color: '#8b949e', padding: '16px' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: '#f85149', padding: '16px' }}>Error: {error}</div>;
  }

  if (!project) {
    return <div style={{ color: '#f85149', padding: '16px' }}>Project not found</div>;
  }

  const latestGithub = engagements?.github?.[engagements.github.length - 1];
  const hasLowEngagement = !latestGithub || latestGithub.stars < 10;
  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div>
      {/* Project Header - GitHub style */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{
          fontSize: '26px',
          fontWeight: 600,
          color: '#e6edf3',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="20" height="20" viewBox="0 0 16 16" fill="#8b949e">
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/>
          </svg>
          {project.name}
        </h1>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#58a6ff', fontSize: '14px' }}
          >
            {project.github_url}
          </a>
        )}
      </div>

      {/* Stats badges - GitHub style */}
      {latestGithub && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#8b949e',
            fontSize: '14px',
          }}>
            <StarIcon />
            <span style={{ fontWeight: 600, color: '#e6edf3' }}>{latestGithub.stars}</span>
            stars
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#8b949e',
            fontSize: '14px',
          }}>
            <ForkIcon />
            <span style={{ fontWeight: 600, color: '#e6edf3' }}>{latestGithub.forks}</span>
            forks
          </div>
        </div>
      )}

      {/* Encouraging message for low engagement */}
      {hasLowEngagement && (
        <div style={{
          background: 'linear-gradient(90deg, #1a472a 0%, #2d5a3d 100%)',
          border: '1px solid #238636',
          borderRadius: '6px',
          padding: '12px 16px',
          marginBottom: '24px',
        }}>
          <p style={{ color: '#7ee787', fontSize: '14px', margin: 0 }}>
            {randomEncouragement}
          </p>
        </div>
      )}

      {/* GitHub Stars Chart */}
      {engagements?.github && engagements.github.length > 0 && (
        <div style={{
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '6px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #21262d',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3', margin: 0 }}>
              GitHub Stats
            </h2>
          </div>
          <div style={{ padding: '16px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={engagements.github}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="date" stroke="#8b949e" fontSize={12} />
                <YAxis stroke="#8b949e" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#e6edf3' }}
                />
                <Legend />
                <Line type="monotone" dataKey="stars" stroke="#e3b341" name="Stars" strokeWidth={2} />
                <Line type="monotone" dataKey="forks" stroke="#8b949e" name="Forks" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Posts */}
      <div style={{
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: '6px',
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #21262d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#e6edf3', margin: 0 }}>
            Promotion Posts
          </h2>
          <span style={{
            background: '#30363d',
            color: '#e6edf3',
            padding: '0 8px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 600,
          }}>
            {project.posts?.length || 0}
          </span>
        </div>
        <div>
          {project.posts && project.posts.length > 0 ? (
            project.posts.map((post, index) => (
              <div
                key={post.id}
                style={{
                  padding: '12px 16px',
                  borderBottom: index < project.posts.length - 1 ? '1px solid #21262d' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{
                  background: getPlatformColor(post.platform),
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}>
                  {post.platform}
                </span>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#58a6ff',
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {post.url}
                </a>
                <span style={{ color: '#8b949e', fontSize: '12px' }}>
                  {new Date(post.posted_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            ))
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ color: '#8b949e', fontSize: '14px', margin: 0 }}>
                まだ投稿がありません。下のフォームから追加しよう！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    // Developer platforms
    zenn: '#3ea8ff',
    qiita: '#55c500',
    reddit: '#ff4500',
    github: '#238636',
    // General platforms
    note: '#41c9b4',
    x: '#1d9bf0',
    instagram: '#e4405f',
    youtube: '#ff0000',
    tiktok: '#000000',
    facebook: '#1877f2',
    threads: '#000000',
  };
  return colors[platform] || '#6e7681';
}
