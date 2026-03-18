import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

interface UserData {
  name: string | null;
  bio: string | null;
  url: string | null;
}

interface UserBioProps {
  userId: string;
}

export default function UserBio({ userId }: UserBioProps) {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/users/${userId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setUserData({ name: data.name, bio: data.bio, url: data.url }))
      .catch(() => {});
  }, [userId]);

  if (!userData) return null;

  return (
    <div style={{ marginBottom: '12px' }}>
      {userData.name && (
        <p style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: '0 0 4px',
        }}>
          {userData.name}
        </p>
      )}
      {userData.bio && (
        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {userData.bio}
        </p>
      )}
      {userData.url && (
        <a
          href={userData.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: 'var(--link-color)',
            marginTop: userData.bio ? '6px' : 0,
          }}
        >
          <i className="fa-solid fa-link" style={{ fontSize: '10px' }}></i>
          {userData.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
      )}
    </div>
  );
}
