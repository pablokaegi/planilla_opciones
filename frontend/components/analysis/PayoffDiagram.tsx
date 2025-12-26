/**
 * PayoffDiagram.tsx - Payoff Visualization with Recharts
 * Displays P&L across spot prices with probability-weighted analysis
 */
'use client';

import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStrategyStore } from '@/store/strategyStore';
import { generateSpotRange, calculateStrategyPayoff, calculateProbabilityOfProfit } from '@/utils/strategyMath';

interface PayoffDiagramProps {
  rangePercent?: number; // Default: 40% (±40%)
  steps?: number; // Default: 100 points
}

export default function PayoffDiagram({ rangePercent = 40, steps = 100 }: PayoffDiagramProps) {
  const legs = useStrategyStore((state) => state.legs);
  const currentSpot = useStrategyStore((state) => state.currentSpot);
  const daysToExpiry = useStrategyStore((state) => state.daysToExpiry);

  // Generate payoff curve data
  const chartData = useMemo(() => {
    if (!legs || legs.length === 0) return [];

    const spotRange = generateSpotRange(currentSpot, rangePercent, steps);
    const payoffs = calculateStrategyPayoff(legs, spotRange);

    return spotRange.map((spot, i) => ({
      spot,
      payoff: payoffs[i],
    }));
  }, [legs, currentSpot, rangePercent, steps]);

  // Calculate probability of profit
  const probabilityOfProfit = useMemo(() => {
    if (!legs || legs.length === 0) return 0;
    
    const avgIV = legs.reduce((sum, leg) => sum + (leg.iv || 0.5), 0) / legs.length;
    return calculateProbabilityOfProfit(legs, currentSpot, avgIV, daysToExpiry);
  }, [legs, currentSpot, daysToExpiry]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const spot = payload[0].payload.spot;
    const payoff = payload[0].value;

    return (
      <div className="bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm text-gray-300">
          Spot: <span className="font-mono text-white">${spot.toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-300">
          P&L: <span className={`font-mono font-bold ${payoff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${payoff.toFixed(2)}
          </span>
        </p>
        <p className="text-sm text-gray-300">
          PoP: <span className="font-mono text-blue-400">{(probabilityOfProfit * 100).toFixed(1)}%</span>
        </p>
      </div>
    );
  };

  // Empty state
  if (!legs || legs.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-900 rounded-lg border border-gray-800">
        <p className="text-gray-500 text-lg">Select options from the grid to build a strategy</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Strategy Payoff Diagram</h3>
        <span className="text-sm text-gray-400">
          Probability of Profit: <span className="text-blue-400 font-bold">{(probabilityOfProfit * 100).toFixed(1)}%</span>
        </span>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          
          <XAxis
            dataKey="spot"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ value: 'Spot Price at Expiry', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ value: 'Profit / Loss', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />

          {/* Zero Line */}
          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" />

          {/* Current Spot Line */}
          <ReferenceLine
            x={currentSpot}
            stroke="#3b82f6"
            strokeWidth={2}
            label={{ value: 'Current', position: 'top', fill: '#3b82f6', fontSize: 12 }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Dual Area: Green for profit, Red for loss */}
          <Area
            type="monotone"
            dataKey={(data) => (data.payoff >= 0 ? data.payoff : 0)}
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorProfit)"
          />
          <Area
            type="monotone"
            dataKey={(data) => (data.payoff < 0 ? data.payoff : 0)}
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorLoss)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
