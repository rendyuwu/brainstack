import { ThemeProvider } from '@/components/theme-provider';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-1)' }}>
        {children}
      </div>
    </ThemeProvider>
  );
}
