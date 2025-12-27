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
  call_ticker: string | null; // Ticker del call (ej: GFGC3000AB)
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
  put_ticker: string | null; // Ticker del put (ej: GFGC3000FE)
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

// ============ GEX Types ============

export interface GexStrike {
  strike: number;
  call_gex: number;
  put_gex: number;
  total_gex: number;
  call_oi: number;
  put_oi: number;
}

export interface GexProfile {
  spot_price: number;
  flip_point: number | null;
  total_call_gex: number;
  total_put_gex: number;
  net_gex: number;
  max_pain: number | null;
  strikes: GexStrike[];
}

// ============ Order Flow / CVD Types ============

export interface FlowDataPoint {
  date: string;
  price: number;
  volume: number;
  buy_volume: number;
  sell_volume: number;
  net_flow: number;
  cvd: number;
}

export interface Divergence {
  divergence: 'bullish' | 'bearish' | null;
  price_trend: 'up' | 'down';
  cvd_trend: 'up' | 'down';
  price_change_pct: number;
  cvd_change: number;
  lookback_periods: number;
}

export interface OrderFlowResponse {
  ticker: string;
  data: FlowDataPoint[];
  divergence: Divergence | null;
}
