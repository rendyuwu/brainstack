import { ThemeProvider } from '@/components/theme-provider';
import { PublicShell } from '@/components/public-shell';
import { Sidebar } from '@/components/sidebar';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { SiteFooter } from '@/components/site-footer';

// All public pages query DB for fresh content — skip static prerendering
export const dynamic = 'force-dynamic';

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
          <SidebarToggle>
            <Sidebar />
          </SidebarToggle>
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
