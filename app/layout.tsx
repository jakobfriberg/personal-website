import type { Metadata } from 'next';
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
    </html>
  );
}
