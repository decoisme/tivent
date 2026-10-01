import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DecentraPass — Verified Event Ticketing',
  description: 'Buy, resell, and verify event tickets with on-chain ownership and secure transactions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${inter.variable}`}>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
