import type { Metadata } from 'next';
import './globals.css';
import { inter, jetbrainsMono, bnRogall } from './fonts';

export const metadata: Metadata = {
  title: 'Jakob Friberg',
  description: 'Personal website of Jakob Friberg',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${bnRogall.variable}`}>
      <body className="min-h-screen">
        <main>{children}</main>
      </body>
    </html>
  );
}
