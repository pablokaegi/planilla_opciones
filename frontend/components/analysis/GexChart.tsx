/**
 * GEX Chart - Gamma Exposure Profile Visualization
 * Shows dealer gamma positioning across strikes with flip point
 */
'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend
} from 'recharts';
import { TrendingUp, Target, AlertTriangle } from 'lucide-react';

interface GexStrike {
  strike: number;
  call_gex: number;
  put_gex: number;
  total_gex: number;
  call_oi: number;
  put_oi: number;
}

interface GexData {
  spot_price: number;
  flip_point: number | null;
  total_call_gex: number;
  total_put_gex: number;
  net_gex: number;
  max_pain: number | null;
  strikes: GexStrike[];
}

interface GexChartProps {
  data: GexData;
  height?: number;
}

export default function GexChart({ data, height = 400 }: GexChartProps) {
  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.strikes.map(strike => ({
      strike: strike.strike,
      callGex: strike.call_gex,
      putGex: strike.put_gex,
      totalGex: strike.total_gex,
      callOI: strike.call_oi,
      putOI: strike.put_oi,
    }));
  }, [data.strikes]);

  // Determine gamma regime
  const isLongGamma = data.net_gex > 0;
  const gammaRegime = isLongGamma ? 'LONG GAMMA' : 'SHORT GAMMA';
  const regimeColor = isLongGamma ? 'text-green-400' : 'text-red-400';
  const regimeDescription = isLongGamma 
    ? 'Dealers hedging will dampen moves (mean reversion)' 
    : 'Dealers hedging will amplify moves (trend following)';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const strike = label;
    const totalGex = payload.find((p: any) => p.dataKey === 'totalGex')?.value || 0;
    const callGex = payload.find((p: any) => p.dataKey === 'callGex')?.value || 0;
    const putGex = payload.find((p: any) => p.dataKey === 'putGex')?.value || 0;
    
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="font-bold text-white mb-2">Strike: ${strike}</p>
        <div className="space-y-1 text-sm">
          <p className="text-green-400">Call GEX: {callGex.toFixed(4)}M</p>
          <p className="text-red-400">Put GEX: {putGex.toFixed(4)}M</p>
          <p className={`font-bold ${totalGex >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            Total: {totalGex.toFixed(4)}M
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Gamma Exposure (GEX) Profile
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Dealer gamma positioning across strikes • Values in $Millions
          </p>
        </div>
        
        {/* Gamma Regime Badge */}
        <div className={`px-3 py-1.5 rounded-lg border ${isLongGamma ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
          <span className={`font-bold text-sm ${regimeColor}`}>{gammaRegime}</span>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Spot Price</p>
          <p className="text-lg font-mono font-bold text-white">${data.spot_price.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Flip Point</p>
          <p className="text-lg font-mono font-bold text-yellow-400">
            {data.flip_point ? `$${data.flip_point.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Max Pain</p>
          <p className="text-lg font-mono font-bold text-purple-400">
            {data.max_pain ? `$${data.max_pain.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="bg-gray-800 rounded p-2 text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Net GEX</p>
          <p className={`text-lg font-mono font-bold ${data.net_gex >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.net_gex.toFixed(2)}M
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="strike" 
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(value) => `${value.toFixed(1)}M`}
              label={{ value: 'GEX ($M)', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
            />
            
            {/* Spot Price Reference Line */}
            <ReferenceLine 
              x={data.spot_price} 
              stroke="#3B82F6" 
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'SPOT', fill: '#3B82F6', fontSize: 10, position: 'top' }}
            />
            
            {/* Flip Point Reference Line */}
            {data.flip_point && (
              <ReferenceLine 
                x={data.flip_point} 
                stroke="#EAB308" 
                strokeWidth={2}
                label={{ value: 'FLIP', fill: '#EAB308', fontSize: 10, position: 'top' }}
              />
            )}
            
            {/* Max Pain Reference Line */}
            {data.max_pain && (
              <ReferenceLine 
                x={data.max_pain} 
                stroke="#A855F7" 
                strokeWidth={1}
                strokeDasharray="3 3"
                label={{ value: 'MAX PAIN', fill: '#A855F7', fontSize: 9, position: 'bottom' }}
              />
            )}

            {/* GEX Bars with conditional coloring */}
            <Bar 
              dataKey="totalGex" 
              name="Total GEX"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.totalGex >= 0 ? '#22C55E' : '#EF4444'}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation Footer */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-4 h-4 mt-0.5 ${regimeColor}`} />
          <div>
            <p className={`text-sm font-medium ${regimeColor}`}>
              Market is in {gammaRegime} regime
            </p>
            <p className="text-xs text-gray-400 mt-1">{regimeDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
