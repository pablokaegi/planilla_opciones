/**
 * VolatilitySmile.tsx - Volatility Smile/Skew Visualization
 * Shows implied volatility curve across ALL strikes from the option chain
 */
'use client';

import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { useOptionChain } from '@/lib/query_client';

interface VolatilitySmileProps {
  symbol: string;
  currentSpot: number;
}

export default function VolatilitySmile({ symbol, currentSpot }: VolatilitySmileProps) {
  
  // Fetch full option chain to get IV for all strikes
  const { data: chainData, isLoading } = useOptionChain(symbol, 30);

  // Extract IV data from the full chain
  const ivData = useMemo(() => {
    if (!chainData?.chain) return [];

    return chainData.chain
      .filter(row => (row.call_iv && row.call_iv > 0) || (row.put_iv && row.put_iv > 0))
      .map(row => ({
        strike: row.strike,
        callIV: row.call_iv ? row.call_iv * 100 : 0,
        putIV: row.put_iv ? row.put_iv * 100 : 0,
        avgIV: ((row.call_iv || 0) + (row.put_iv || 0)) / 2 * 100,
        moneyness: ((row.strike - currentSpot) / currentSpot) * 100,
      }))
      .sort((a, b) => a.strike - b.strike);
  }, [chainData, currentSpot]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg shadow-xl">
        <p className="text-sm text-gray-300 mb-2">
          Strike: <span className="font-mono text-white font-bold">${data.strike.toFixed(2)}</span>
        </p>
        <p className="text-xs text-gray-400 mb-2">
          Moneyness: {data.moneyness >= 0 ? '+' : ''}{data.moneyness.toFixed(1)}%
        </p>
        {data.callIV > 0 && (
          <p className="text-sm text-green-400">
            Call IV: <span className="font-mono font-bold">{data.callIV.toFixed(1)}%</span>
          </p>
        )}
        {data.putIV > 0 && (
          <p className="text-sm text-red-400">
            Put IV: <span className="font-mono font-bold">{data.putIV.toFixed(1)}%</span>
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">Loading volatility data...</p>
      </div>
    );
  }

  if (ivData.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No implied volatility data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px]">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white">Volatility Smile</h3>
        <p className="text-xs text-gray-500 mt-1">Implied volatility across strikes</p>
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-gray-400">Call IV</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span className="text-gray-400">Put IV</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-blue-500"></div>
          <span className="text-gray-400">ATM (Current Spot)</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={ivData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          
          <XAxis
            dataKey="strike"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ 
              value: 'Strike Price', 
              position: 'insideBottom', 
              offset: -10, 
              fill: '#9ca3af',
              fontSize: 11 
            }}
          />
          
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            label={{ 
              value: 'Implied Volatility (%)', 
              angle: -90, 
              position: 'insideLeft', 
              fill: '#9ca3af',
              fontSize: 11 
            }}
          />

          {/* ATM Line */}
          <ReferenceLine
            x={currentSpot}
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{ 
              value: 'ATM', 
              position: 'top', 
              fill: '#3b82f6', 
              fontSize: 10
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Call IV Line */}
          <Line
            type="monotone"
            dataKey="callIV"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />

          {/* Put IV Line */}
          <Line
            type="monotone"
            dataKey="putIV"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
