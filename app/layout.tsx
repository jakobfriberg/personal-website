import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { inter, jetbrainsMono, bnRogall } from './fonts';
import { SoundProvider } from './context/sound-context';

export const metadata: Metadata = {
  title: 'Jakob Eck Friberg',
  description: 'Personal website of Jakob Friberg',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${bnRogall.variable}`}>
      <body className="min-h-screen overflow-hidden">
        <SoundProvider>
          <main>{children}</main>
        </SoundProvider>
      </body>
      {process.env.NODE_ENV === 'production' && (
        <GoogleAnalytics gaId="G-DLX4Y33RFT" />
      )}
    </html>
  );
}
