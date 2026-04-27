const TITLE_WIDTHS = ['70%', '55%', '80%', '65%', '75%'];

export default function CheatsheetsLoading() {
  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <div
        style={{
          width: '200px',
          height: '28px',
          background: 'var(--bg-3)',
          borderRadius: '6px',
          marginBottom: '24px',
          animation: 'skeleton 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--bd-default)',
              borderRadius: '8px',
              padding: '20px',
              animation: 'skeleton 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div
              style={{
                width: TITLE_WIDTHS[i],
                height: '18px',
                background: 'var(--bg-3)',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                width: '85%',
                height: '14px',
                background: 'var(--bg-3)',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                width: '35%',
                height: '12px',
                background: 'var(--bg-3)',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes skeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
