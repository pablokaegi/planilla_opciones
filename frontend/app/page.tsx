'use client';

/**
 * Main Page - Options Strategizer with Strategy Builder & Analytics
 */
import { useState, useCallback } from 'react';
import { useQueryClient } from '@/lib/query_client';
import StrategyBuilder from '@/components/analysis/StrategyBuilder';
import StrategyAnalysis from '@/components/analysis/StrategyAnalysis';
import AnalyticsDashboard from '@/components/analysis/AnalyticsDashboard';
import { BarChart3, Layers, RefreshCw, Clock } from 'lucide-react';

type ViewMode = 'strategy' | 'analytics';

export default function Home() {
  const [ticker, setTicker] = useState('GGAL');
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [inputTicker, setInputTicker] = useState('GGAL');
  const [inputDays, setInputDays] = useState('30');
  const [viewMode, setViewMode] = useState<ViewMode>('strategy');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const queryClient = useQueryClient();

  const handleSearch = () => {
    setTicker(inputTicker.toUpperCase());
    setDaysToExpiry(parseInt(inputDays) || 30);
  };

  // Refresh all data - invalidates all queries forcing refetch

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Clear backend cache first
      const response = await fetch('http://localhost:8000/api/v1/cache/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      await response.json();
    } catch (e) {
      console.warn('Cache clear failed:', e);
    }

    // Invalidate and refetch all relevant queries (option chain, gex, flow, levels)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['optionChain', ticker, daysToExpiry] }),
      queryClient.invalidateQueries({ queryKey: ['gex-profile', ticker] }),
      queryClient.invalidateQueries({ queryKey: ['order-flow', ticker] }),
      queryClient.invalidateQueries({ queryKey: ['gex-levels', ticker] })
    ]);
    // Opcional: forzar refetch inmediato
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['optionChain', ticker, daysToExpiry] }),
      queryClient.refetchQueries({ queryKey: ['gex-profile', ticker] }),
      queryClient.refetchQueries({ queryKey: ['order-flow', ticker] }),
      queryClient.refetchQueries({ queryKey: ['gex-levels', ticker] })
    ]);

    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, [queryClient, ticker, daysToExpiry]);

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return null;
    return lastUpdate.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header with Controls */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              Inky Web - Options Strategizer
            </h1>
            
            {/* Refresh Button & Last Update */}
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Última actualización: {formatLastUpdate()}</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isRefreshing
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/25'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar Precios'}
              </button>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ticker Symbol
              </label>
              <input
                type="text"
                value={inputTicker}
                onChange={(e) => setInputTicker(e.target.value)}
                placeholder="e.g., GGAL, YPF, AAPL"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Days to Expiry
              </label>
              <input
                type="number"
                value={inputDays}
                onChange={(e) => setInputDays(e.target.value)}
                placeholder="30"
                min="1"
                max="365"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Load Chain
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => setViewMode('strategy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'strategy'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                Strategy Builder
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'analytics'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                GEX & Flow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1800px] mx-auto p-6">
        {viewMode === 'strategy' ? (
          <>
            {/* Strategy Builder Dashboard */}
            <StrategyBuilder ticker={ticker} daysToExpiry={daysToExpiry} />
          </>
        ) : (
          /* Analytics Dashboard - GEX & Order Flow */
          <AnalyticsDashboard ticker={ticker} />
        )}
      </div>

      {/* Strategy Analysis (Full Screen Overlay) */}
      <StrategyAnalysis />
    </main>
  );
}
