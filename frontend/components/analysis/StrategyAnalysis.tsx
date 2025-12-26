/**
 * StrategyAnalysis.tsx - Professional Strategy Analysis Dashboard
 * Full analysis view with sensitivity, payoff diagram, volatility smile, and flow
 */
'use client';

import React, { useState } from 'react';
import { useStrategyStore } from '@/store/strategyStore';
import { X, ChevronLeft, Settings } from 'lucide-react';
import PayoffDiagramPro from '@/components/analysis/PayoffDiagramPro';
import SensitivityTablePro from '@/components/analysis/SensitivityTablePro';
import VolatilitySmile from '@/components/analysis/VolatilitySmile';
import ContractFlow from '@/components/analysis/ContractFlow';
import StrategyMetrics from '@/components/analysis/StrategyMetrics';

export default function StrategyAnalysis() {
  const confirmedStrategy = useStrategyStore((state) => state.confirmedStrategy);
  const clearConfirmedStrategy = useStrategyStore((state) => state.clearConfirmedStrategy);
  const currentSpot = useStrategyStore((state) => state.currentSpot);
  const daysToExpiry = useStrategyStore((state) => state.daysToExpiry);

  // Range controls for sensitivity (adjustable for Argentina volatility)
  const [rangePercent, setRangePercent] = useState(50); // ±50% default for Argentina

  if (!confirmedStrategy || confirmedStrategy.length === 0) {
    return null;
  }

  // Get strategy name
  const strategyName = confirmedStrategy.length === 1 
    ? `${confirmedStrategy[0].side === 'long' ? 'Long' : 'Short'} ${confirmedStrategy[0].type.toUpperCase()}`
    : `${confirmedStrategy.length}-Leg Strategy`;

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={clearConfirmedStrategy}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Back to builder"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{strategyName}</h1>
              <p className="text-sm text-gray-400">
                {confirmedStrategy[0].symbol} • Spot: ${currentSpot.toFixed(2)} • {daysToExpiry} DTE
              </p>
            </div>
          </div>
          
          {/* Range Control */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Range:</span>
              <input
                type="range"
                min="20"
                max="100"
                value={rangePercent}
                onChange={(e) => setRangePercent(Number(e.target.value))}
                className="w-32"
              />
              <span className="text-sm font-mono text-white min-w-[60px]">±{rangePercent}%</span>
            </div>
            <button
              onClick={clearConfirmedStrategy}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close analysis"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Top Row: Payoff Diagram + Metrics */}
        <div className="grid grid-cols-12 gap-6">
          {/* Payoff Diagram - Professional */}
          <div className="col-span-12 lg:col-span-8">
            <PayoffDiagramPro 
              legs={confirmedStrategy}
              currentSpot={currentSpot}
              daysToExpiry={daysToExpiry}
              rangePercent={rangePercent}
            />
          </div>

          {/* Strategy Metrics */}
          <div className="col-span-12 lg:col-span-4">
            <StrategyMetrics />
          </div>
        </div>

        {/* Middle Row: Sensitivity Table */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <SensitivityTablePro 
              legs={confirmedStrategy}
              currentSpot={currentSpot}
              daysToExpiry={daysToExpiry}
              rangePercent={rangePercent}
            />
          </div>
        </div>

        {/* Bottom Row: Volatility Smile + Contract Flow */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-6">
            <VolatilitySmile 
              symbol={confirmedStrategy[0].symbol}
              currentSpot={currentSpot}
            />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <ContractFlow 
              symbol={confirmedStrategy[0].symbol}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
