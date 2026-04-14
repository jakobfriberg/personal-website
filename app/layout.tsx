import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import { inter, jetbrainsMono, bnRogall } from './fonts';

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
        <main>{children}</main>
      </body>
      {process.env.NODE_ENV === 'production' && (
        <GoogleAnalytics gaId="G-DLX4Y33RFT" />
      )}
    </html>
  );
}
