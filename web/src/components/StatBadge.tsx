interface StatBadgeProps {
  icon: string;
  value: number;
  color?: string;
  iconSize?: number;
  fontSize?: number;
}

/**
 * Stat display badge component (icon + number)
 */
export default function StatBadge({
  icon,
  value,
  color,
  iconSize = 10,
  fontSize = 11,
}: StatBadgeProps) {
  if (value <= 0) return null;

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: `${fontSize}px`,
        color: 'var(--text-secondary)',
      }}
    >
      <i
        className={icon}
        style={{ fontSize: `${iconSize}px`, color: color || 'inherit' }}
      ></i>
      {value}
    </span>
  );
}

// Preset stat badges
export function LikesBadge({ value }: { value: number }) {
  return <StatBadge icon="fa-solid fa-heart" value={value} color="#f43f5e" />;
}

export function CommentsBadge({ value }: { value: number }) {
  return <StatBadge icon="fa-solid fa-comment" value={value} />;
}

export function SharesBadge({ value }: { value: number }) {
  return <StatBadge icon="fa-solid fa-share" value={value} />;
}

export function StarsBadge({ value, fontSize = 12 }: { value: number; fontSize?: number }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: `${fontSize}px`,
      }}
    >
      <i className="fa-solid fa-star" style={{ fontSize: `${fontSize}px`, color: '#e3b341' }}></i>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </span>
  );
}

export function ForksBadge({ value, fontSize = 12 }: { value: number; fontSize?: number }) {
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: `${fontSize}px`,
      }}
    >
      <i className="fa-solid fa-code-fork" style={{ fontSize: `${fontSize}px`, color: 'var(--text-secondary)' }}></i>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </span>
  );
}
