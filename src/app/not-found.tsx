import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--tx-2)',
        background: 'var(--bg-1)',
      }}
    >
      <div style={{ fontSize: '72px', fontWeight: 300, color: 'var(--tx-3)' }}>404</div>
      <h1 style={{ color: 'var(--tx-1)', fontSize: '24px', fontWeight: 500 }}>Page not found</h1>
      <p style={{ fontSize: '15px' }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        style={{
          marginTop: '8px',
          padding: '8px 20px',
          background: 'var(--amber)',
          color: '#000',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
