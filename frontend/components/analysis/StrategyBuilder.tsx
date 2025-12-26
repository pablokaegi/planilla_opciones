/**
 * StrategyBuilder.tsx - Complete Strategy Analysis Dashboard
 * Integrates: OptionChainGrid → StrategyPanel → PayoffDiagram → StrategyMetrics
 */
'use client';

import React from 'react';
import OptionChainGrid from '@/components/dashboard/OptionChainGrid';
import StrategyPanel from '@/components/dashboard/StrategyPanel';
import PayoffDiagram from '@/components/analysis/PayoffDiagram';
import StrategyMetrics from '@/components/analysis/StrategyMetrics';
import SensitivityTable from '@/components/analysis/SensitivityTable';

interface StrategyBuilderProps {
  ticker: string;
  daysToExpiry: number;
}

export default function StrategyBuilder({ ticker, daysToExpiry }: StrategyBuilderProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 px-6 py-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Strategy Builder</h1>
        <p className="text-sm text-gray-400 mt-1">
          {ticker} - {daysToExpiry} DTE
        </p>
      </div>

      {/* Main Layout */}
      <div className="space-y-6">
        {/* Option Chain Grid (Top Section) */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4 text-white">Option Chain</h2>
          <p className="text-xs text-gray-500 mb-4">Click on Bid or Ask prices in the grid above to build your strategy</p>
          <OptionChainGrid ticker={ticker} daysToExpiry={daysToExpiry} />
        </div>

        {/* Analysis Dashboard (Bottom Section) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Strategy Legs (3 columns) */}
          <div className="lg:col-span-3">
            <StrategyPanel />
          </div>

          {/* Center: Payoff Diagram (5 columns) */}
          <div className="lg:col-span-5">
            <PayoffDiagram />
          </div>

          {/* Right: Strategy Metrics (4 columns) */}
          <div className="lg:col-span-4">
            <StrategyMetrics />
          </div>

          {/* Bottom: Sensitivity Table (full width) */}
          <div className="lg:col-span-12">
            <SensitivityTable />
          </div>
        </div>
      </div>
    </div>
  );
}
