interface BackLinkProps {
  href?: string;
  label?: string;
}

/**
 * Back navigation link component
 */
export default function BackLink({ href = '/', label = '戻る' }: BackLinkProps) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <a
        href={href}
        style={{ color: 'var(--text-secondary)', fontSize: '12px' }}
      >
        <i className="fa-solid fa-arrow-left" style={{ marginRight: '4px' }}></i>
        {label}
      </a>
    </div>
  );
}
