/**
 * StrategyMetrics.tsx - Comprehensive Strategy Analytics
 * Displays key risk metrics: Max Profit/Loss, Breakevens, Net Cost, PoP
 */
'use client';

import React from 'react';
import { useStrategyStore } from '@/store/strategyStore';
import { TrendingUp, TrendingDown, Target, DollarSign, Percent } from 'lucide-react';

export default function StrategyMetrics() {
  const getMetrics = useStrategyStore((state) => state.getMetrics);
  const confirmedStrategy = useStrategyStore((state) => state.confirmedStrategy);
  const legs = confirmedStrategy || [];

  // Get computed metrics from confirmed strategy
  const metrics = getMetrics();

  // Empty state
  if (!legs || legs.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-full flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Build a strategy to see<br />risk metrics
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-full overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Strategy Metrics</h3>

      <div className="space-y-3">
        {/* Net Cost */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Net Cost</span>
          </div>
          <span className={`font-mono font-bold ${metrics.netCost >= 0 ? 'text-red-400' : 'text-green-400'}`}>
            ${Math.abs(metrics.netCost).toFixed(2)}
            <span className="text-xs ml-1 text-gray-500">
              {metrics.netCost >= 0 ? '(Debit)' : '(Credit)'}
            </span>
          </span>
        </div>

        {/* Max Profit */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Max Profit</span>
          </div>
          <span className="font-mono font-bold text-green-400">
            {metrics.maxProfit === null ? '∞' : `$${metrics.maxProfit.toFixed(2)}`}
          </span>
        </div>

        {/* Max Loss */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-300">Max Loss</span>
          </div>
          <span className="font-mono font-bold text-red-400">
            {metrics.maxLoss === null ? '∞' : `$${Math.abs(metrics.maxLoss).toFixed(2)}`}
          </span>
        </div>

        {/* Breakeven Points */}
        <div className="p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-300">Breakeven Points</span>
          </div>
          {metrics.breakevens.length === 0 ? (
            <p className="text-xs text-gray-500 ml-6">None</p>
          ) : (
            <div className="ml-6 space-y-1">
              {metrics.breakevens.map((be, i) => (
                <p key={i} className="text-sm font-mono text-yellow-400">
                  ${be.toFixed(2)}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Probability of Profit */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">Probability of Profit</span>
          </div>
          <span className="font-mono font-bold text-blue-400">
            {(metrics.probabilityOfProfit * 100).toFixed(1)}%
          </span>
        </div>

        {/* Net Delta */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400">Δ</span>
            <span className="text-sm text-gray-300">Net Delta</span>
          </div>
          <span className={`font-mono font-bold ${metrics.netDelta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.netDelta.toFixed(3)}
          </span>
        </div>

        {/* Net Gamma */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400">Γ</span>
            <span className="text-sm text-gray-300">Net Gamma</span>
          </div>
          <span className={`font-mono ${metrics.netGamma >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.netGamma.toFixed(4)}
          </span>
        </div>

        {/* Net Theta */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400">Θ</span>
            <span className="text-sm text-gray-300">Net Theta</span>
          </div>
          <span className={`font-mono ${metrics.netTheta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.netTheta.toFixed(3)}
          </span>
        </div>

        {/* Net Vega */}
        <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-400">ν</span>
            <span className="text-sm text-gray-300">Net Vega</span>
          </div>
          <span className={`font-mono ${metrics.netVega >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {metrics.netVega.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}
