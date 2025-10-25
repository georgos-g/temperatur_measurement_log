import { AuthSessionProvider } from '@/components/auth-session-provider';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
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
  title: 'Temperatur Logger',
  description: 'Mobile-optimierte Temperaturmessungs-App mit Screenshot-Upload',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Temperatur Logger',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='de' className='h-full'>
      <head>
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='Temperature Logger' />
        <meta name='mobile-web-app-capable' content='yes' />
        <meta name='msapplication-TileColor' content='#000000' />
        <meta name='msapplication-config' content='/browserconfig.xml' />
        <link rel='apple-touch-icon' href='/icon-192x192.png' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full bg-background text-foreground safe-area-padding`}
      >
        <AuthSessionProvider>
          <ThemeProvider
            defaultTheme='system'
            storageKey='temperature-app-theme'
          >
            <AuthProvider>
              <div className='min-h-screen flex flex-col'>{children}</div>
            </AuthProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
