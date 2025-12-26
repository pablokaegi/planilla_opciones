import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query_client';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Inky Web - Options Strategizer',
  description: 'Professional Options Chain Analysis and Strategy Builder',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
