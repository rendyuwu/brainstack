export default function EditorLoading() {
  return (
    <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
      <div
        style={{
          width: '160px',
          height: '28px',
          background: 'var(--bg-3)',
          borderRadius: '6px',
          marginBottom: '20px',
          animation: 'skeleton 1.5s ease-in-out infinite',
        }}
      />
      <div
        style={{
          width: '120px',
          height: '36px',
          background: 'var(--bg-3)',
          borderRadius: '6px',
          marginBottom: '24px',
          animation: 'skeleton 1.5s ease-in-out infinite',
          animationDelay: '0.1s',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--bd-default)',
              borderRadius: '8px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              animation: 'skeleton 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div>
              <div
                style={{
                  width: '200px',
                  height: '16px',
                  background: 'var(--bg-3)',
                  borderRadius: '4px',
                  marginBottom: '8px',
                }}
              />
              <div
                style={{
                  width: '100px',
                  height: '12px',
                  background: 'var(--bg-3)',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div
              style={{
                width: '60px',
                height: '24px',
                background: 'var(--bg-3)',
                borderRadius: '12px',
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
