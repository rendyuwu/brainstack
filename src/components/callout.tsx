import { Icon } from './icons';

type CalloutType = 'info' | 'warning' | 'tip' | 'danger';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const CALLOUT_STYLES: Record<CalloutType, { icon: string; color: string; bg: string; bd: string }> = {
  info: {
    icon: 'info',
    color: 'var(--blue)',
    bg: 'rgba(88,166,255,.07)',
    bd: 'rgba(88,166,255,.2)',
  },
  warning: {
    icon: 'alertCircle',
    color: 'var(--amber)',
    bg: 'var(--amber-bg)',
    bd: 'var(--amber-bd)',
  },
  tip: {
    icon: 'zap',
    color: 'var(--green)',
    bg: 'rgba(63,185,80,.07)',
    bd: 'rgba(63,185,80,.2)',
  },
  danger: {
    icon: 'alertCircle',
    color: 'var(--red)',
    bg: 'rgba(248,81,73,.07)',
    bd: 'rgba(248,81,73,.2)',
  },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const t = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.info;
  return (
    <div
      style={{
        background: t.bg,
        border: `1px solid ${t.bd}`,
        borderRadius: 8,
        padding: '14px 16px',
        margin: '20px 0',
        display: 'flex',
        gap: 12,
      }}
    >
      <Icon name={t.icon} size={16} style={{ color: t.color, flexShrink: 0, marginTop: 2 }} />
      <div>
        {title && (
          <div style={{ fontWeight: 600, fontSize: 14, color: t.color, marginBottom: 4 }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 14, color: 'var(--tx-2)', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  );
}
