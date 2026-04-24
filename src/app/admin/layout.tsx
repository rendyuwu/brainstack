import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--bd-default)',
          background: 'var(--bg-1)',
          gap: 12,
        }}
      >
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
        <div style={{ flex: 1 }} />
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
      </nav>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
}
