'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { optionsApi } from '@/lib/api';
import OptionsTable from '@/components/OptionsTable';

export default function Home() {
  const [ticker, setTicker] = useState('GGAL');
  const [useMock, setUseMock] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['optionChain', ticker, useMock],
    queryFn: () => optionsApi.getOptionChain(ticker, useMock),
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Inky Web - Options Strategizer
          </h1>
          <p className="text-gray-400">BYMA/Merval Options Analysis with Greeks</p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Ticker Input */}
            <div className="flex items-center gap-2">
              <label htmlFor="ticker" className="font-semibold">Ticker:</label>
              <input
                id="ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2 uppercase w-32"
                placeholder="GGAL"
              />
            </div>

            {/* Mock Data Toggle */}
            <div className="flex items-center gap-2">
              <label htmlFor="useMock" className="font-semibold">Use Mock Data:</label>
              <input
                id="useMock"
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold transition-colors"
            >
              Refresh
            </button>

            {/* Market Info */}
            {data && (
              <div className="ml-auto flex gap-6 text-sm">
                <div>
                  <span className="text-gray-400">Spot:</span>{' '}
                  <span className="font-bold text-green-400">${data.spot_price.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Expiry:</span>{' '}
                  <span className="font-semibold">{data.expiration_date}</span>
                </div>
                <div>
                  <span className="text-gray-400">DTE:</span>{' '}
                  <span className="font-semibold">{data.days_to_expiry} days</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <div className="text-xl text-gray-400">Loading option chain data...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
            <div className="text-red-400 font-semibold mb-2">Error loading data:</div>
            <div className="text-red-300">{error.message}</div>
          </div>
        )}

        {/* Options Table */}
        {data && !isLoading && (
          <OptionsTable data={data} spotPrice={data.spot_price} />
        )}
      </div>
    </div>
  );
}
