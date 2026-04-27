export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        padding: '24px 32px',
        borderTop: '1px solid var(--bd-subtle)',
        fontSize: 12,
        color: 'var(--tx-3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}
    >
      <span>© {year} BrainStack. Built for IT professionals.</span>
      <div style={{ display: 'flex', gap: 16 }}>
        <a
          href="/ask"
          style={{ color: 'var(--tx-3)', textDecoration: 'none' }}
        >
          AI Chat
        </a>
        <a
          href="/discover"
          style={{ color: 'var(--tx-3)', textDecoration: 'none' }}
        >
          Discover
        </a>
      </div>
    </footer>
  );
}
