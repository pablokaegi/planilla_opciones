/**
 * FlowChart - Order Flow / CVD (Cumulative Volume Delta) Visualization
 * Shows price vs CVD to detect divergences and institutional flow
 */
'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface FlowDataPoint {
  date: string;
  price: number;
  volume: number;
  buy_volume: number;
  sell_volume: number;
  net_flow: number;
  cvd: number;
}

interface Divergence {
  divergence: 'bullish' | 'bearish' | null;
  price_trend: 'up' | 'down';
  cvd_trend: 'up' | 'down';
  price_change_pct: number;
  cvd_change: number;
  lookback_periods: number;
}

interface FlowChartProps {
  data: FlowDataPoint[];
  divergence?: Divergence | null;
  ticker: string;
  height?: number;
}

export default function FlowChart({ data, divergence, ticker, height = 400 }: FlowChartProps) {
  // Transform and normalize data for dual axis chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Normalize CVD for better visualization
    const cvdValues = data.map(d => d.cvd);
    const maxCvd = Math.max(...cvdValues.map(Math.abs));
    
    return data.map(point => ({
      date: point.date,
      price: point.price,
      cvd: point.cvd,
      cvdNormalized: maxCvd > 0 ? (point.cvd / maxCvd) * 100 : 0,
      volume: point.volume,
      netFlow: point.net_flow,
      buyVol: point.buy_volume,
      sellVol: point.sell_volume,
    }));
  }, [data]);

  // Calculate price range for better axis scaling
  const priceRange = useMemo(() => {
    if (!chartData.length) return { min: 0, max: 100 };
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;
    return { min: min - padding, max: max + padding };
  }, [chartData]);

  // Divergence styling
  const getDivergenceInfo = () => {
    if (!divergence || !divergence.divergence) {
      return {
        type: 'NEUTRAL',
        color: 'text-gray-400',
        bgColor: 'bg-gray-800 border-gray-700',
        icon: Activity,
        description: 'Price and CVD moving in sync'
      };
    }
    
    if (divergence.divergence === 'bullish') {
      return {
        type: 'BULLISH DIVERGENCE',
        color: 'text-green-400',
        bgColor: 'bg-green-900/30 border-green-700',
        icon: TrendingUp,
        description: 'Price down but CVD rising → Accumulation detected'
      };
    }
    
    return {
      type: 'BEARISH DIVERGENCE',
      color: 'text-red-400',
      bgColor: 'bg-red-900/30 border-red-700',
      icon: TrendingDown,
      description: 'Price up but CVD falling → Distribution detected'
    };
  };

  const divInfo = getDivergenceInfo();
  const DivIcon = divInfo.icon;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const priceData = payload.find((p: any) => p.dataKey === 'price');
    const cvdData = payload.find((p: any) => p.dataKey === 'cvd');
    const volumeData = payload.find((p: any) => p.dataKey === 'volume');
    
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
        <p className="font-bold text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          {priceData && (
            <p className="text-gray-300">
              Price: <span className="font-mono text-white">${priceData.value.toFixed(2)}</span>
            </p>
          )}
          {cvdData && (
            <p className="text-blue-400">
              CVD: <span className="font-mono">{(cvdData.value / 1000000).toFixed(2)}M</span>
            </p>
          )}
          {volumeData && (
            <p className="text-gray-500">
              Volume: <span className="font-mono">{(volumeData.value / 1000).toFixed(0)}K</span>
            </p>
          )}
        </div>
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500">No flow data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Order Flow Analysis ({ticker})
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Cumulative Volume Delta (CVD) vs Price • Detects institutional flow
          </p>
        </div>
        
        {/* Divergence Badge */}
        <div className={`px-3 py-1.5 rounded-lg border ${divInfo.bgColor}`}>
          <div className="flex items-center gap-1.5">
            <DivIcon className={`w-4 h-4 ${divInfo.color}`} />
            <span className={`font-bold text-sm ${divInfo.color}`}>{divInfo.type}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {divergence && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-800 rounded p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Price Trend</p>
            <p className={`text-lg font-bold ${divergence.price_trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {divergence.price_trend === 'up' ? '↑' : '↓'} {Math.abs(divergence.price_change_pct).toFixed(1)}%
            </p>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">CVD Trend</p>
            <p className={`text-lg font-bold ${divergence.cvd_trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
              {divergence.cvd_trend === 'up' ? '↑ BUYING' : '↓ SELLING'}
            </p>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">CVD Change</p>
            <p className="text-lg font-mono font-bold text-blue-400">
              {(divergence.cvd_change / 1000000).toFixed(2)}M
            </p>
          </div>
          <div className="bg-gray-800 rounded p-2 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold">Lookback</p>
            <p className="text-lg font-mono font-bold text-gray-300">
              {divergence.lookback_periods} days
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 60, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            
            {/* Left Y-Axis: Price */}
            <YAxis 
              yAxisId="price"
              orientation="left"
              domain={[priceRange.min, priceRange.max]}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              label={{ value: 'Price', angle: -90, position: 'insideLeft', fill: '#9CA3AF', fontSize: 12 }}
            />
            
            {/* Right Y-Axis: CVD */}
            <YAxis 
              yAxisId="cvd"
              orientation="right"
              tick={{ fill: '#3B82F6', fontSize: 11 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              label={{ value: 'CVD', angle: 90, position: 'insideRight', fill: '#3B82F6', fontSize: 12 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
            />
            
            {/* Zero line for CVD */}
            <ReferenceLine 
              yAxisId="cvd"
              y={0} 
              stroke="#4B5563" 
              strokeDasharray="3 3"
            />
            
            {/* Price Area */}
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="price"
              name="Price"
              stroke="#6B7280"
              fill="#6B7280"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            
            {/* CVD Line */}
            <Line
              yAxisId="cvd"
              type="monotone"
              dataKey="cvd"
              name="CVD"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation Footer */}
      <div className="mt-4 p-3 bg-gray-800/50 rounded border border-gray-700">
        <div className="flex items-start gap-2">
          <AlertCircle className={`w-4 h-4 mt-0.5 ${divInfo.color}`} />
          <div>
            <p className={`text-sm font-medium ${divInfo.color}`}>{divInfo.description}</p>
            <p className="text-xs text-gray-500 mt-1">
              CVD measures net buying pressure. Divergence from price often precedes reversals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
