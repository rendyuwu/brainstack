interface TagProps {
  label: string;
  color?: string;
  onClick?: () => void;
  small?: boolean;
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  docker:   { bg: 'var(--tag-docker-bg)',   text: 'var(--tag-docker-text)' },
  linux:    { bg: 'var(--tag-linux-bg)',     text: 'var(--tag-linux-text)' },
  git:      { bg: 'var(--tag-git-bg)',       text: 'var(--tag-git-text)' },
  k8s:      { bg: 'var(--tag-k8s-bg)',       text: 'var(--tag-k8s-text)' },
  nginx:    { bg: 'var(--tag-nginx-bg)',      text: 'var(--tag-nginx-text)' },
  postgres: { bg: 'var(--tag-postgres-bg)',   text: 'var(--tag-postgres-text)' },
  ai:       { bg: 'var(--teal-bg)',          text: 'var(--teal)' },
  default:  { bg: 'var(--bg-3)',             text: 'var(--tx-2)' },
};

export function Tag({ label, color, onClick, small }: TagProps) {
  const c = TAG_COLORS[color ?? 'default'] ?? TAG_COLORS.default;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: small ? '2px 7px' : '3px 9px',
        fontSize: small ? '11px' : '12px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 500,
        borderRadius: '4px',
        background: c.bg,
        color: c.text,
        cursor: onClick ? 'pointer' : 'default',
        letterSpacing: '0.02em',
        userSelect: 'none',
        transition: 'opacity .15s',
      }}
    >
      {label}
    </span>
  );
}
