import type { Metadata } from 'next';
import './globals.css';
import { inter, jetbrainsMono, bnRogall, bungee } from './fonts';

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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${bnRogall.variable} ${bungee.variable}`}>
      <body className="min-h-screen overflow-hidden">
        <main>{children}</main>
      </body>
    </html>
  );
}
