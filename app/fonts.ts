import { Inter, JetBrains_Mono, Bungee } from 'next/font/google';
import localFont from 'next/font/local';

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  display: 'swap'
});

export const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap'
});

export const bungee = Bungee({
  variable: '--font-bungee',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const bnRogall = localFont({
  src: './fonts/BNRogall.otf',
  variable: '--font-bn-rogall',
  display: 'swap',
});
