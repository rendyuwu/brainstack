import Link from 'next/link';

export default function ArticleNotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        fontFamily: 'var(--font-sans)',
        color: 'var(--tx-2)',
      }}
    >
      <div style={{ fontSize: '48px', fontWeight: 300, color: 'var(--tx-3)' }}>404</div>
      <h1 style={{ color: 'var(--tx-1)', fontSize: '22px', fontWeight: 500 }}>
        Article not found
      </h1>
      <p style={{ fontSize: '14px' }}>This article may have been moved or deleted.</p>
      <Link
        href="/blog"
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
        Browse articles
      </Link>
    </div>
  );
}
