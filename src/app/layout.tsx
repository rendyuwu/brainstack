import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://brainstack.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | BrainStack',
    default: 'BrainStack — Knowledge-First IT Publishing',
  },
  description:
    'Tutorials, cheatsheets, and deep-dive articles on Docker, Kubernetes, Linux, Git, Nginx, and PostgreSQL — built for developers and ops engineers.',
  openGraph: {
    type: 'website',
    siteName: 'BrainStack',
    locale: 'en_US',
    url: BASE_URL,
    title: 'BrainStack — Knowledge-First IT Publishing',
    description:
      'Tutorials, cheatsheets, and deep-dive articles on Docker, Kubernetes, Linux, Git, Nginx, and PostgreSQL.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrainStack — Knowledge-First IT Publishing',
    description:
      'Tutorials, cheatsheets, and deep-dive articles on Docker, Kubernetes, Linux, Git, Nginx, and PostgreSQL.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
