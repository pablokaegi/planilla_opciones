'use client';

/**
 * Main Page - Options Strategizer with Strategy Builder
 */
import { useState } from 'react';
import StrategyBuilder from '@/components/analysis/StrategyBuilder';
import StrategyAnalysis from '@/components/analysis/StrategyAnalysis';

export default function Home() {
  const [ticker, setTicker] = useState('GGAL');
  const [daysToExpiry, setDaysToExpiry] = useState(30);
  const [inputTicker, setInputTicker] = useState('GGAL');
  const [inputDays, setInputDays] = useState('30');

  const handleSearch = () => {
    setTicker(inputTicker.toUpperCase());
    setDaysToExpiry(parseInt(inputDays) || 30);
  };

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header with Controls */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
            Inky Web - Strategy Builder
          </h1>
          
          {/* Controls */}
          <div className="flex gap-4 items-end">
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
          </div>
        </div>
      </div>

      {/* Strategy Builder Dashboard */}
      <StrategyBuilder ticker={ticker} daysToExpiry={daysToExpiry} />

      {/* Strategy Analysis (Full Screen Overlay) */}
      <StrategyAnalysis />
    </main>
  );
}
