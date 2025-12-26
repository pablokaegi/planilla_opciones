/**
 * PayoffDiagramPro.tsx - Professional Payoff Diagram
 * Enhanced version with breakeven markers, profit/loss zones, and professional styling
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
  ReferenceDot,
} from 'recharts';
import { StrategyLeg } from '@/store/strategyStore';
import { 
  generateSpotRange, 
  calculateStrategyPayoff, 
  calculateBreakevens,
  calculateProbabilityOfProfit 
} from '@/utils/strategyMath';

interface PayoffDiagramProProps {
  legs: StrategyLeg[];
  currentSpot: number;
  daysToExpiry: number;
  rangePercent?: number;
  steps?: number;
}

export default function PayoffDiagramPro({ 
  legs, 
  currentSpot, 
  daysToExpiry,
  rangePercent = 50, 
  steps = 150 
}: PayoffDiagramProProps) {
  
  // Early validation
  if (!legs || legs.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[500px] flex items-center justify-center">
        <p className="text-gray-400">No strategy legs to display</p>
      </div>
    );
  }

  if (!currentSpot || currentSpot <= 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[500px] flex items-center justify-center">
        <p className="text-gray-400">Invalid spot price</p>
      </div>
    );
  }
  
  // Generate payoff curve data
  const chartData = useMemo(() => {
    if (legs.length === 0) return [];

    // generateSpotRange ya divide por 100 internamente, así que pasamos el porcentaje directo
    const spotRange = generateSpotRange(currentSpot, rangePercent, steps);
    const payoffs = calculateStrategyPayoff(legs, spotRange);

    console.log('📊 PayoffDiagram DEBUG:', {
      legs: legs.length,
      currentSpot,
      rangePercent,
      spotRangeStart: spotRange[0]?.toFixed(2),
      spotRangeEnd: spotRange[spotRange.length - 1]?.toFixed(2),
      payoffStart: payoffs[0]?.toFixed(2),
      payoffMiddle: payoffs[Math.floor(payoffs.length/2)]?.toFixed(2),
      payoffEnd: payoffs[payoffs.length - 1]?.toFixed(2),
    });
    
    // Log cada leg para debug
    legs.forEach((leg, i) => {
      console.log(`  Leg ${i}: ${leg.side} ${leg.type} strike=${leg.strike} price=${leg.price}`);
    });

    return spotRange.map((spot, i) => ({
      spot,
      payoff: payoffs[i],
    }));
  }, [legs, currentSpot, rangePercent, steps]);

  // Calculate breakevens
  const breakevens = useMemo(() => {
    return calculateBreakevens(legs, currentSpot);
  }, [legs, currentSpot]);

  // Calculate probability of profit
  const probabilityOfProfit = useMemo(() => {
    if (legs.length === 0) return 0;
    
    const avgIV = legs.reduce((sum, leg) => sum + (leg.iv || 0.5), 0) / legs.length;
    return calculateProbabilityOfProfit(legs, currentSpot, avgIV, daysToExpiry);
  }, [legs, currentSpot, daysToExpiry]);

  // Find max profit and max loss in range
  const { maxProfit, maxLoss } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { maxProfit: 0, maxLoss: 0 };
    }
    const payoffs = chartData.map(d => d.payoff).filter(p => !isNaN(p) && isFinite(p));
    if (payoffs.length === 0) {
      return { maxProfit: 0, maxLoss: 0 };
    }
    return {
      maxProfit: Math.max(...payoffs),
      maxLoss: Math.min(...payoffs),
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const spot = payload[0].payload.spot;
    const payoff = payload[0].value;
    const pctChange = ((spot - currentSpot) / currentSpot) * 100;

    return (
      <div className="bg-gray-900 border border-gray-700 px-4 py-3 rounded-lg shadow-xl">
        <p className="text-xs text-gray-500 mb-1">At Expiration</p>
        <p className="text-sm text-gray-300">
          Spot: <span className="font-mono text-white font-bold">${spot.toFixed(2)}</span>
          <span className={`ml-2 text-xs ${pctChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%)
          </span>
        </p>
        <p className="text-sm text-gray-300 mt-1">
          P&L: <span className={`font-mono font-bold ${payoff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${payoff.toFixed(2)}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[500px]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Strategy Payoff at Expiration</h3>
          <p className="text-xs text-gray-500 mt-1">Profit/Loss across spot price range</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Probability of Profit</p>
          <p className="text-2xl font-bold text-blue-400">{(probabilityOfProfit * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-400">Profit Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-gray-400">Loss Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-blue-500"></div>
          <span className="text-gray-400">Current Spot</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          <span className="text-gray-400">Breakeven</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            {/* Professional gradients */}
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          
          <XAxis
            dataKey="spot"
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ 
              value: 'Underlying Price at Expiration', 
              position: 'insideBottom', 
              offset: -10, 
              fill: '#9ca3af',
              fontSize: 12 
            }}
          />
          
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            label={{ 
              value: 'Profit / Loss ($)', 
              angle: -90, 
              position: 'insideLeft', 
              fill: '#9ca3af',
              fontSize: 12 
            }}
          />

          {/* Zero Line (Profit/Loss boundary) */}
          <ReferenceLine 
            y={0} 
            stroke="#6b7280" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            label={{ value: 'Break-even', position: 'right', fill: '#6b7280', fontSize: 11 }}
          />

          {/* Current Spot Line */}
          <ReferenceLine
            x={currentSpot}
            stroke="#3b82f6"
            strokeWidth={2}
            label={{ 
              value: `Current: $${currentSpot.toFixed(2)}`, 
              position: 'top', 
              fill: '#3b82f6', 
              fontSize: 11,
              fontWeight: 'bold'
            }}
          />

          {/* Breakeven markers */}
          {breakevens.map((be, i) => (
            <ReferenceDot
              key={i}
              x={be}
              y={0}
              r={5}
              fill="#facc15"
              stroke="#854d0e"
              strokeWidth={2}
              label={{ 
                value: `BE: $${be.toFixed(2)}`, 
                position: 'top', 
                fill: '#facc15', 
                fontSize: 10,
                offset: 10
              }}
            />
          ))}

          <Tooltip content={<CustomTooltip />} />

          {/* Profit Area (green) */}
          <Area
            type="monotone"
            dataKey={(data) => (data.payoff >= 0 ? data.payoff : 0)}
            stroke="#10b981"
            strokeWidth={3}
            fill="url(#profitGradient)"
          />
          
          {/* Loss Area (red) */}
          <Area
            type="monotone"
            dataKey={(data) => (data.payoff < 0 ? data.payoff : 0)}
            stroke="#ef4444"
            strokeWidth={3}
            fill="url(#lossGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Stats Footer */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm border-t border-gray-800 pt-3">
        <div>
          <span className="text-gray-400">Max Profit in Range:</span>
          <span className="ml-2 font-mono font-bold text-green-400">${maxProfit.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-400">Max Loss in Range:</span>
          <span className="ml-2 font-mono font-bold text-red-400">${Math.abs(maxLoss).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
