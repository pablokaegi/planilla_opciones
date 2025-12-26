/**
 * API Client for Inky Web Backend
 */
import axios from 'axios';
import type { OptionChainResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch option chain data for a ticker
 */
export async function fetchOptionChain(
  ticker: string,
  daysToExpiry: number = 30,
  useMock: boolean = false // Changed to false - use real API data by default
): Promise<OptionChainResponse> {
  const response = await apiClient.get<OptionChainResponse>(
    `/api/v1/chain/${ticker}`,
    {
      params: { 
        days_to_expiry: daysToExpiry,
        use_mock: useMock 
      },
    }
  );
  return response.data;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const response = await apiClient.get('/api/v1/health');
  return response.data;
}

export default apiClient;
