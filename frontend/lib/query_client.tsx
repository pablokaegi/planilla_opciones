'use client';

/**
 * React Query Providers and Hooks
 */
import { QueryClient, QueryClientProvider, useQuery, useQueryClient as useReactQueryClient } from '@tanstack/react-query';
import { fetchOptionChain } from '@/lib/api_client';
import type { OptionChainResponse } from '@/lib/types';
import { ReactNode } from 'react';

// Create a client - export for direct access if needed
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Data is fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes (previously cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Query Client Provider Component
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Re-export useQueryClient for convenience
 */
export function useQueryClient() {
  return useReactQueryClient();
}

/**
 * Custom hook to fetch option chain data
 */
export function useOptionChain(ticker: string, daysToExpiry: number = 30) {
  return useQuery<OptionChainResponse>({
    queryKey: ['optionChain', ticker, daysToExpiry],
    queryFn: () => fetchOptionChain(ticker, daysToExpiry),
    enabled: !!ticker, // Only run if ticker is provided
  });
}
