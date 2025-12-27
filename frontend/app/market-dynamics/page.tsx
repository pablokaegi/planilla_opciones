/**
 * Market Dynamics Page - GEX & Order Flow Dashboard
 * Professional-grade dealer positioning and flow analysis
 */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingUp, RefreshCw, AlertTriangle } from 'lucide-react';
import GexChart from '@/components/analysis/GexChart';
import FlowChart from '@/components/analysis/FlowChart';
import apiClient from '@/lib/api_client';

// API fetch functions
async function fetchGexProfile(ticker: string, daysToExpiry: number = 30) {
  const response = await apiClient.get(`/api/v1/analytics/gex/${ticker}`, {
    params: { days_to_expiry: daysToExpiry }
  });
  return response.data;
}

async function fetchOrderFlow(ticker: string, days: number = 30) {
  const response = await apiClient.get(`/api/v1/analytics/flow/${ticker}`, {
    params: { days, detect_divergence: true }
  });
  return response.data;
}

export default function MarketDynamicsPage() {
  const [ticker, setTicker] = useState('GGAL');
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [flowDays, setFlowDays] = useState(30);

  // Fetch GEX data
  const { 
    data: gexData, 
    isLoading: gexLoading, 
    error: gexError,
    refetch: refetchGex 
  } = useQuery({
    queryKey: ['gex', ticker, daysToExpiry],
    queryFn: () => fetchGexProfile(ticker, daysToExpiry),
    staleTime: 60000, // 1 minute
    retry: 2
  });

  // Fetch Order Flow data
  const { 
    data: flowData, 
    isLoading: flowLoading, 
    error: flowError,
    refetch: refetchFlow 
  } = useQuery({
    queryKey: ['flow', ticker, flowDays],
    queryFn: () => fetchOrderFlow(ticker, flowDays),
    staleTime: 60000,
    retry: 2
  });

  const handleRefresh = () => {
    refetchGex();
    refetchFlow();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-400" />
                <h1 className="text-xl font-bold">Market Dynamics</h1>
              </div>
              <span className="text-sm text-gray-500">
                GEX Profile & Order Flow Analysis
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Ticker Select */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Ticker:</label>
                <select
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="GGAL">GGAL (Galicia)</option>
                  <option value="YPF">YPF</option>
                  <option value="PAMP">PAMP (Pampa)</option>
                  <option value="TXAR">TXAR (Ternium)</option>
                </select>
              </div>

              {/* Expiry Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-400">Expiry:</label>
                <select
                  value={daysToExpiry}
                  onChange={(e) => setDaysToExpiry(Number(e.target.value))}
                  className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${(gexLoading || flowLoading) ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 py-6 space-y-6">
        
        {/* GEX Section */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold">Gamma Exposure (GEX)</h2>
            <span className="text-xs text-gray-500 ml-2">
              Shows where dealers need to hedge - key support/resistance levels
            </span>
          </div>

          {gexLoading ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-gray-400">Loading GEX data...</span>
              </div>
            </div>
          ) : gexError ? (
            <div className="bg-gray-900 rounded-lg border border-red-900/50 p-8">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <p className="font-medium">Error loading GEX data</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(gexError as Error).message || 'Please try again'}
                  </p>
                </div>
              </div>
            </div>
          ) : gexData ? (
            <GexChart data={gexData} height={450} />
          ) : null}
        </section>

        {/* Order Flow Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Order Flow (CVD)</h2>
              <span className="text-xs text-gray-500 ml-2">
                Cumulative Volume Delta - detects institutional accumulation/distribution
              </span>
            </div>
            
            {/* Flow period selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Period:</label>
              <select
                value={flowDays}
                onChange={(e) => setFlowDays(Number(e.target.value))}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={7}>7 Days</option>
                <option value={14}>14 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          </div>

          {flowLoading ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-gray-400">Loading flow data...</span>
              </div>
            </div>
          ) : flowError ? (
            <div className="bg-gray-900 rounded-lg border border-red-900/50 p-8">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <p className="font-medium">Error loading flow data</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {(flowError as Error).message || 'Please try again'}
                  </p>
                </div>
              </div>
            </div>
          ) : flowData ? (
            <FlowChart 
              data={flowData.data} 
              divergence={flowData.divergence}
              ticker={flowData.ticker}
              height={400} 
            />
          ) : null}
        </section>

        {/* Educational Footer */}
        <section className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            How to Read These Charts
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-green-400 mb-2">GEX (Gamma Exposure)</h4>
              <ul className="space-y-2 text-gray-400">
                <li>• <span className="text-green-400">Green bars</span> = Positive GEX → Dealers BUY dips, SELL rallies (stabilizing)</li>
                <li>• <span className="text-red-400">Red bars</span> = Negative GEX → Dealers SELL dips, BUY rallies (amplifying)</li>
                <li>• <span className="text-yellow-400">Flip Point</span> = Key level where dealer behavior changes</li>
                <li>• <span className="text-purple-400">Max Pain</span> = Strike where most options expire worthless</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-400 mb-2">CVD (Order Flow)</h4>
              <ul className="space-y-2 text-gray-400">
                <li>• CVD ↑ + Price ↑ = Strong uptrend (confirmed)</li>
                <li>• CVD ↓ + Price ↓ = Strong downtrend (confirmed)</li>
                <li>• CVD ↑ + Price ↓ = <span className="text-green-400">Bullish divergence</span> (accumulation)</li>
                <li>• CVD ↓ + Price ↑ = <span className="text-red-400">Bearish divergence</span> (distribution)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
