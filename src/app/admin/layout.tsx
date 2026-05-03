import Link from 'next/link';
import styles from './admin-layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <nav className={styles.nav}>
        <Link
          href="/"
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--tx-1)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          BrainStack
        </Link>
        <span
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-bd)',
            color: 'var(--amber)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}
        >
          Admin
        </span>
        <div className={styles.spacer} />
        <Link
          href="/admin/ai/providers"
          style={{
            fontSize: 13.5,
            color: 'var(--tx-2)',
            padding: '6px 12px',
            borderRadius: 6,
            transition: 'color .15s',
          }}
        >
          AI Providers
        </Link>
        <Link
          href="/admin/ai/usage"
          style={{
            fontSize: 13.5,
            color: 'var(--tx-2)',
            padding: '6px 12px',
            borderRadius: 6,
            transition: 'color .15s',
          }}
        >
          AI Usage
        </Link>
      </nav>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
