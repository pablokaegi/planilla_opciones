'use client';

import React, { useMemo, useEffect } from 'react';
import { generateSensitivityTable, getHeatmapColor, getMaxAbsValue } from '@/utils/sensitivity';

interface Leg {
  type: 'call' | 'put';
  strike: number;
  price: number;
  side: 'long' | 'short'; // Changed from 'action' to match sensitivity.ts
  quantity: number;
  daysToExpiry: number;
  iv?: number; // Changed from 'volatility' to match sensitivity.ts
}

interface SensitivityTableProProps {
  legs: Leg[];
  currentSpot: number;
  daysToExpiry: number;
  rangePercent: number;
}

const SensitivityTablePro: React.FC<SensitivityTableProProps> = ({ 
  legs, 
  currentSpot, 
  daysToExpiry,
  rangePercent 
}) => {
  const riskFreeRate = 0.26; // 26% for Argentina

  // 🔍 DEBUG: Ver exactamente qué datos llegaron
  useEffect(() => {
    console.log('🔍 [SensitivityTablePro] DEBUG DATA:');
    console.log('  currentSpot:', currentSpot);
    console.log('  daysToExpiry:', daysToExpiry);
    console.log('  legs:', JSON.stringify(legs, null, 2));
    legs.forEach((leg, i) => {
      console.log(`  Leg ${i}: type=${leg.type}, strike=${leg.strike}, price=${leg.price}, side=${leg.side}, qty=${leg.quantity}`);
    });
  }, [legs, currentSpot, daysToExpiry]);

  const sensitivityData = useMemo(() => {
    if (!legs || legs.length === 0) return [];
    return generateSensitivityTable(
      legs,
      currentSpot,
      daysToExpiry,
      riskFreeRate,
      rangePercent,
      41 // Number of rows (steps)
    );
  }, [legs, currentSpot, daysToExpiry, rangePercent]);

  // Get max absolute value for heatmap normalization
  const maxAbsValue = useMemo(() => {
    return getMaxAbsValue(sensitivityData);
  }, [sensitivityData]);

  if (!legs || legs.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
        <p className="text-slate-400 text-center">No hay estrategia confirmada</p>
      </div>
    );
  }

  // Find best/worst scenarios for summary
  const maxProfit = Math.max(...sensitivityData.map(d => d.expiration));
  const maxLoss = Math.min(...sensitivityData.map(d => d.expiration));

  return (
    <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 px-6 py-4 border-b border-slate-700">
        <h3 className="text-lg font-semibold text-white">Tabla de Sensibilidad - Rango Ampliado</h3>
        <p className="text-sm text-slate-400 mt-1">
          Payoff de la estrategia en diferentes niveles de precio del subyacente
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Precio Spot
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Cambio %
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Valor Teórico
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Al Vencimiento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sensitivityData.map((row, idx) => {
              const isCurrent = row.isCurrentPrice;
              const isBreakeven = row.isBreakeven;
              
              return (
                <tr 
                  key={idx}
                  className={`
                    ${isCurrent ? 'bg-blue-500/10 border-l-4 border-blue-500' : ''}
                    ${isBreakeven ? 'bg-yellow-500/5' : ''}
                    hover:bg-slate-800/30 transition-colors
                  `}
                >
                  <td className="px-4 py-2 text-sm text-white font-medium">
                    ${row.spotPrice.toFixed(2)}
                    {isCurrent && <span className="ml-2 text-xs text-blue-400">(Actual)</span>}
                  </td>
                  <td className={`px-4 py-2 text-sm font-medium ${
                    row.spotChange > 0 ? 'text-emerald-400' : 
                    row.spotChange < 0 ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {row.spotChange > 0 ? '+' : ''}{row.spotChange.toFixed(1)}%
                  </td>
                  <td 
                    className="px-4 py-2 text-sm text-right font-semibold"
                    style={{ backgroundColor: getHeatmapColor(row.today, maxAbsValue) }}
                  >
                    <span className={row.today >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                      ${row.today.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td 
                    className="px-4 py-2 text-sm text-right font-semibold"
                    style={{ backgroundColor: getHeatmapColor(row.expiration, maxAbsValue) }}
                  >
                    <span className={row.expiration >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                      ${row.expiration.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-slate-800/30 px-6 py-4 border-t border-slate-700 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-400 mb-1">Máxima Ganancia</p>
          <p className="text-lg font-bold text-emerald-400">
            ${maxProfit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Máxima Pérdida</p>
          <p className="text-lg font-bold text-red-400">
            ${maxLoss.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-1">Riesgo/Beneficio</p>
          <p className="text-lg font-bold text-blue-400">
            {maxLoss !== 0 ? (maxProfit / Math.abs(maxLoss)).toFixed(2) : '∞'}:1
          </p>
        </div>
      </div>
    </div>
  );
};

export default SensitivityTablePro;
