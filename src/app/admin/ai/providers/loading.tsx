export default function ProvidersLoading() {
  return (
    <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div
        style={{
          width: '180px',
          height: '28px',
          background: 'var(--bg-3)',
          borderRadius: '6px',
          marginBottom: '24px',
          animation: 'skeleton 1.5s ease-in-out infinite',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--bd-default)',
              borderRadius: '8px',
              padding: '20px',
              animation: 'skeleton 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div
                  style={{
                    width: '140px',
                    height: '18px',
                    background: 'var(--bg-3)',
                    borderRadius: '4px',
                    marginBottom: '10px',
                  }}
                />
                <div
                  style={{
                    width: '220px',
                    height: '13px',
                    background: 'var(--bg-3)',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div
                style={{
                  width: '48px',
                  height: '24px',
                  background: 'var(--bg-3)',
                  borderRadius: '12px',
                }}
              />
            </div>
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
