import { ThemeProvider } from '@/components/theme-provider';
import { PublicShell } from '@/components/public-shell';
import { Sidebar } from '@/components/sidebar';
import { SiteFooter } from '@/components/site-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <PublicShell>
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            height: 'calc(100vh - 52px)',
          }}
        >
          <Sidebar />
          <main
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
              {children}
            </div>
            <SiteFooter />
          </main>
        </div>
      </PublicShell>
    </ThemeProvider>
  );
}
