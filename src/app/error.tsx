'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[GlobalError]', error);

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
      <div style={{ fontSize: '48px' }}>⚠</div>
      <h1 style={{ color: 'var(--tx-1)', fontSize: '24px', fontWeight: 500 }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: '15px' }}>An unexpected error occurred. Please try again.</p>
      {error.digest && (
        <p style={{ fontSize: '12px', color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          marginTop: '8px',
          padding: '8px 20px',
          background: 'var(--amber)',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Try again
      </button>
    </div>
  );
}
