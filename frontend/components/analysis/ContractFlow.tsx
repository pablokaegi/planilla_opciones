/**
 * ContractFlow.tsx - Contract Volume and Open Interest Flow
 * Shows volume and OI distribution for the underlying
 */
'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import { useOptionChain } from '@/lib/query_client';

interface ContractFlowProps {
  symbol: string;
}

export default function ContractFlow({ symbol }: ContractFlowProps) {
  
  // Fetch option chain to get volume and OI data
  const { data: chainData } = useOptionChain(symbol, 30);

  // Process data to extract volume and OI
  const flowData = React.useMemo(() => {
    if (!chainData?.chain) return [];

    // Group by strike
    const strikeMap = new Map<number, { 
      strike: number; 
      callVolume: number; 
      putVolume: number;
      callOI: number;
      putOI: number;
    }>();

    chainData.chain.forEach(row => {
      const existing = strikeMap.get(row.strike) || {
        strike: row.strike,
        callVolume: 0,
        putVolume: 0,
        callOI: 0,
        putOI: 0,
      };

      existing.callVolume += row.call_volume || 0;
      existing.putVolume += row.put_volume || 0;
      existing.callOI += row.call_open_interest || 0;
      existing.putOI += row.put_open_interest || 0;

      strikeMap.set(row.strike, existing);
    });

    return Array.from(strikeMap.values())
      .sort((a, b) => a.strike - b.strike)
      .slice(0, 15); // Top 15 strikes by activity
  }, [chainData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg shadow-xl">
        <p className="text-sm text-white font-bold mb-2">Strike: ${label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-mono font-bold">{entry.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  };

  if (flowData.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px] flex items-center justify-center">
        <p className="text-gray-500">No contract flow data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px]">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white">Contract Flow</h3>
        <p className="text-xs text-gray-500 mt-1">Volume and Open Interest by strike</p>
      </div>

      {/* Summary Stats */}
      <div className="mb-3 grid grid-cols-2 gap-4 text-xs">
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400 mb-1">Total Call Volume</p>
          <p className="text-green-400 font-bold font-mono">
            {flowData.reduce((sum, d) => sum + d.callVolume, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <p className="text-gray-400 mb-1">Total Put Volume</p>
          <p className="text-red-400 font-bold font-mono">
            {flowData.reduce((sum, d) => sum + d.putVolume, 0).toLocaleString()}
          </p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="70%">
        <BarChart data={flowData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          
          <XAxis
            dataKey="strike"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={(value) => `$${value}`}
            label={{ 
              value: 'Strike Price', 
              position: 'insideBottom', 
              offset: -10, 
              fill: '#9ca3af',
              fontSize: 10 
            }}
          />
          
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
            label={{ 
              value: 'Contracts', 
              angle: -90, 
              position: 'insideLeft', 
              fill: '#9ca3af',
              fontSize: 10 
            }}
          />

          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ fontSize: '11px' }}
            iconType="square"
          />

          <Bar 
            dataKey="callVolume" 
            fill="#10b981" 
            name="Call Volume"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="putVolume" 
            fill="#ef4444" 
            name="Put Volume"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
