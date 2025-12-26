/**
 * Type definitions for Options API
 */

export interface OptionGreeks {
  iv: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
}

export interface OptionChainRow {
  strike: number;
  
  // Call side
  call_bid: number | null;
  call_ask: number | null;
  call_last: number | null;
  call_volume: number | null;
  call_open_interest: number | null;
  call_iv: number | null;
  call_delta: number | null;
  call_gamma: number | null;
  call_theta: number | null;
  call_vega: number | null;
  
  // Put side
  put_bid: number | null;
  put_ask: number | null;
  put_last: number | null;
  put_volume: number | null;
  put_open_interest: number | null;
  put_iv: number | null;
  put_delta: number | null;
  put_gamma: number | null;
  put_theta: number | null;
  put_vega: number | null;
}

export interface OptionChainResponse {
  ticker: string;
  spot_price: number;
  timestamp: string;
  expiration_date: string;
  days_to_expiry: number;
  chain: OptionChainRow[];
}
