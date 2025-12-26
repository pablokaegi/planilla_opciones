'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20 * 1000, // 20 seconds to match backend cache TTL
        refetchInterval: 20 * 1000, // Auto-refetch every 20 seconds
      },
    },
  }));

  return (
    <html lang="es">
      <head>
        <title>Inky Web - Options Strategizer (BYMA/Merval)</title>
        <meta name="description" content="Professional options analysis for Argentine market" />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
