import { useState, useEffect } from 'react';
import { API_BASE } from '../utils/api';

interface UserBioProps {
  userId: string;
}

export default function UserBio({ userId }: UserBioProps) {
  const [bio, setBio] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/users/${userId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setBio(data.bio))
      .catch(() => {});
  }, [userId]);

  if (!bio) return null;

  return (
    <p style={{
      fontSize: '12px',
      color: 'var(--text-secondary)',
      margin: '0 0 12px 0',
      lineHeight: 1.5,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    }}>
      {bio}
    </p>
  );
}
