export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-1)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
