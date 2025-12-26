/**
 * Type definitions for option chain data from backend API
 */

export interface OptionRow {
  strike: number;
  
  // Call option data
  call_bid: number;
  call_ask: number;
  call_last: number;
  call_volume: number;
  call_open_interest: number;
  call_iv: number;
  call_delta: number;
  call_gamma: number;
  call_theta: number;
  call_vega: number;
  
  // Put option data
  put_bid: number;
  put_ask: number;
  put_last: number;
  put_volume: number;
  put_open_interest: number;
  put_iv: number;
  put_delta: number;
  put_gamma: number;
  put_theta: number;
  put_vega: number;
}

export interface OptionChainResponse {
  ticker: string;
  spot_price: number;
  timestamp: string;
  expiration_date: string;
  days_to_expiry: number;
  chain: OptionRow[];
}

export interface StradleViewRow {
  strike: number;
  
  // Call columns
  callBid: number;
  callAsk: number;
  callLast: number;
  callVolume: number;
  callOI: number;
  callIV: number;
  callDelta: number;
  callGamma: number;
  callTheta: number;
  callVega: number;
  
  // Put columns
  putBid: number;
  putAsk: number;
  putLast: number;
  putVolume: number;
  putOI: number;
  putIV: number;
  putDelta: number;
  putGamma: number;
  putTheta: number;
  putVega: number;
}
