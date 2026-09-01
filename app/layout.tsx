import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AppProvider } from '@/components/app-provider';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://iswebmcp.mlmrx.chatgpt.site'),
  title: {
    default: 'isWebMCP — Detect it. Test it. Prove it.',
    template: '%s · isWebMCP',
  },
  description:
    'An evidence-based before-and-after laboratory for agent-ready web applications.',
  openGraph: {
    title: 'Is your web app truly WebMCP ready?',
    description: 'Detect it. Test it. Prove it.',
    type: 'website',
    url: 'https://iswebmcp.mlmrx.chatgpt.site',
    siteName: 'isWebMCP',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: 'isWebMCP — Is your web app truly WebMCP ready?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Is your web app truly WebMCP ready?',
    description: 'Detect it. Test it. Prove it.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </AppProvider>
      </body>
    </html>
  );
}
