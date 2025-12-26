/**
 * SensitivityTable.tsx - Professional Sensitivity Analysis with Black-Scholes
 * Shows theoretical P&L across price and time scenarios with heatmap
 */
'use client';

import React, { useMemo } from 'react';
import { useStrategyStore } from '@/store/strategyStore';
import { 
  generateSensitivityTable, 
  getHeatmapColor, 
  getMaxAbsValue 
} from '@/utils/sensitivity';

export default function SensitivityTable() {
  const legs = useStrategyStore((state) => state.legs);
  const currentSpot = useStrategyStore((state) => state.currentSpot);
  const daysToExpiry = useStrategyStore((state) => state.daysToExpiry);

  // Generate sensitivity data with Black-Scholes
  const sensitivityData = useMemo(() => {
    if (!legs || legs.length === 0) return [];

    return generateSensitivityTable(
      legs,
      currentSpot,
      daysToExpiry,
      0.26, // Argentina risk-free rate
      20,  // ±20% range
      11   // 11 steps
    );
  }, [legs, currentSpot, daysToExpiry]);

  // Get max value for heatmap normalization
  const maxAbsValue = useMemo(() => {
    return getMaxAbsValue(sensitivityData);
  }, [sensitivityData]);

  // Empty state
  if (!legs || legs.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-full flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Build a strategy to see<br />sensitivity analysis
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Sensitivity Analysis</h3>
        <p className="text-xs text-gray-400 mt-1">
          Theoretical P&L across price and time scenarios (Black-Scholes model)
        </p>
      </div>

      {/* Legend */}
      <div className="mb-4 flex items-center gap-6 text-xs flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-12 h-3 bg-gradient-to-r from-red-500 via-gray-900 to-green-500 rounded"></div>
          <span className="text-gray-400">Loss → Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">•</span>
          <span className="text-blue-400 font-semibold">T+0</span>
          <span className="text-gray-400">= Today (Theoretical)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">•</span>
          <span className="text-purple-400 font-semibold">T+50%</span>
          <span className="text-gray-400">= Half-Life</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">•</span>
          <span className="text-orange-400 font-semibold">Finish</span>
          <span className="text-gray-400">= Expiration</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-700">
              <th className="text-left text-gray-400 font-semibold pb-3 pr-4 whitespace-nowrap">Spot Price</th>
              <th className="text-center text-gray-400 font-semibold pb-3 px-3 whitespace-nowrap">Change</th>
              <th className="text-right text-blue-400 font-semibold pb-3 px-3 whitespace-nowrap">
                T+0<br/>
                <span className="text-xs font-normal text-gray-500">(Today)</span>
              </th>
              <th className="text-right text-purple-400 font-semibold pb-3 px-3 whitespace-nowrap">
                T+50%<br/>
                <span className="text-xs font-normal text-gray-500">(Half-Life)</span>
              </th>
              <th className="text-right text-orange-400 font-semibold pb-3 pl-3 whitespace-nowrap">
                Finish<br/>
                <span className="text-xs font-normal text-gray-500">(Expiration)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sensitivityData.map((scenario, i) => {
              const isCurrent = scenario.isCurrentPrice || Math.abs(scenario.spotPrice - currentSpot) < 1;
              const isBreakeven = scenario.isBreakeven || Math.abs(scenario.expiration) < 50;
              
              // Estilo especial para breakevens
              let rowClass = 'border-b border-gray-800 hover:bg-gray-800/50 transition-colors';
              if (isBreakeven && !isCurrent) {
                rowClass += ' bg-yellow-900/20 border-yellow-500/50';
              } else if (isCurrent) {
                rowClass += ' bg-blue-900/20';
              }
              
              return (
                <tr 
                  key={i} 
                  className={rowClass}
                >
                  {/* Spot Price */}
                  <td className="py-2.5 pr-4">
                    <span className={`font-mono font-semibold ${
                      isBreakeven ? 'text-yellow-400' : 
                      isCurrent ? 'text-blue-400' : 
                      'text-white'
                    }`}>
                      ${scenario.spotPrice.toFixed(2)}
                      {isBreakeven && <span className="ml-2 text-xs">🎯</span>}
                    </span>
                  </td>

                  {/* Change % */}
                  <td className="py-2.5 px-3 text-center">
                    <span className={`text-xs font-mono font-semibold ${
                      scenario.spotChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {scenario.spotChange >= 0 ? '+' : ''}{scenario.spotChange.toFixed(1)}%
                    </span>
                  </td>

                  {/* T+0 (Today - Theoretical) */}
                  <td 
                    className="py-2.5 px-3 text-right font-mono font-semibold rounded"
                    style={{ backgroundColor: getHeatmapColor(scenario.today, maxAbsValue) }}
                  >
                    <span className={scenario.today >= 0 ? 'text-green-300' : 'text-red-300'}>
                      ${scenario.today.toFixed(2)}
                    </span>
                  </td>

                  {/* T+50% (Half-Life) */}
                  <td 
                    className="py-2.5 px-3 text-right font-mono font-semibold rounded"
                    style={{ backgroundColor: getHeatmapColor(scenario.halfLife, maxAbsValue) }}
                  >
                    <span className={scenario.halfLife >= 0 ? 'text-green-300' : 'text-red-300'}>
                      ${scenario.halfLife.toFixed(2)}
                    </span>
                  </td>

                  {/* Expiration (Finish) */}
                  <td 
                    className="py-2.5 pl-3 text-right font-mono font-semibold rounded"
                    style={{ backgroundColor: getHeatmapColor(scenario.expiration, maxAbsValue) }}
                  >
                    <span className={scenario.expiration >= 0 ? 'text-green-300' : 'text-red-300'}>
                      ${scenario.expiration.toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
        {/* Breakeven summary */}
        {sensitivityData.some(s => s.isBreakeven) && (
          <div className="bg-yellow-900/10 border border-yellow-500/30 rounded p-3 mb-3">
            <p className="text-sm text-yellow-400 font-semibold">
              🎯 Breakevens detectados: {sensitivityData.filter(s => s.isBreakeven).length} punto(s)
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Precios donde el P&L al vencimiento está cerca de cero (±$50)
            </p>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            💡 <strong className="text-gray-400">T+0 (Today)</strong>: Theoretical value if price moves NOW (includes time value).
          </p>
          <p>
            💡 <strong className="text-gray-400">T+50%</strong>: Theoretical value when half the time has passed (theta decay).
          </p>
          <p>
            💡 <strong className="text-gray-400">Finish</strong>: Intrinsic value at expiration (no time value).
          </p>
        </div>
      </div>
    </div>
  );
}
