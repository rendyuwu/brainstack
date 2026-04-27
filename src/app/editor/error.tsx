'use client';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error('[EditorError]', error);

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
      <div style={{ fontSize: '48px' }}>⚠</div>
      <h2 style={{ color: 'var(--tx-1)', fontSize: '20px', fontWeight: 500 }}>
        Editor error
      </h2>
      <p style={{ fontSize: '14px' }}>Something went wrong loading the editor.</p>
      {error.digest && (
        <p style={{ fontSize: '12px', color: 'var(--tx-3)', fontFamily: 'var(--font-mono)' }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
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
