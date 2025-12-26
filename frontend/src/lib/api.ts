/**
 * API client for fetching option chain data from backend
 */
import axios from 'axios';
import { OptionChainResponse } from '@/types/options';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const optionsApi = {
  /**
   * Fetch option chain data for a given ticker
   * @param ticker - Stock ticker symbol (e.g., GGAL, YPF)
   * @param useMock - Whether to use mock data (for testing)
   */
  async getOptionChain(ticker: string, useMock: boolean = false): Promise<OptionChainResponse> {
    const url = `${API_BASE_URL}/api/v1/chain/${ticker}`;
    const params = useMock ? { use_mock: true } : {};
    
    const response = await axios.get<OptionChainResponse>(url, { params });
    return response.data;
  },
  
  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await axios.get(`${API_BASE_URL}/api/v1/health`);
    return response.data;
  },
};
