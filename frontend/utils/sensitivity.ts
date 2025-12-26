/**
 * sensitivity.ts
 * Corrige el error de valores constantes recalculando Black-Scholes para cada celda.
 */

import { calculateGreeks } from './blackScholes';
import { StrategyLeg } from '@/store/strategyStore';

export interface SensitivityScenario {
  spotPrice: number;
  spotChange: number;
  today: number;
  halfLife: number;
  expiration: number;
  isCurrentPrice: boolean;
  isBreakeven: boolean;
}

export const generateSensitivityTable = (
  legs: StrategyLeg[],
  currentSpot: number,
  daysToExpiry: number,
  riskFreeRate: number = 0.26,
  rangePercent: number = 20,
  steps: number = 21
): SensitivityScenario[] => {
  if (!currentSpot || legs.length === 0) return [];

  const rows: SensitivityScenario[] = [];
  const start = currentSpot * (1 - rangePercent / 100);
  const end = currentSpot * (1 + rangePercent / 100);
  const stepSize = (end - start) / (steps - 1);

  // Tiempos en años
  const t_today = Math.max(daysToExpiry / 365, 0.001);
  const t_half = t_today / 2;

  for (let i = 0; i < steps; i++) {
    // 1. EL PRECIO SIMULADO (Aquí estaba el error, antes se usaba currentSpot fijo)
    let simulatedSpot = start + i * stepSize;
    if (Math.abs(simulatedSpot - currentSpot) < stepSize / 2) simulatedSpot = currentSpot; // Snap al precio actual

    let pnlToday = 0;
    let pnlHalf = 0;
    let pnlExpiry = 0;

    legs.forEach(leg => {
      const k = Number(leg.strike) || 0;
      const qty = Number(leg.quantity) || 1;
      const entry = Number(leg.price) || 0;
      const iv = leg.iv || 0.40;
      
      // DEBUG: Log para verificar datos
      if (i === 0) {
        console.log(`🔍 Sensitivity Leg: strike=${k}, price=${entry}, qty=${qty}, iv=${iv}, type=${leg.type}, side=${leg.side}`);
      }
      
      // BLINDAJE: Normalizar tipos
      const typeNormalized = (leg.type || 'call').toLowerCase();
      const sideNormalized = (leg.side || 'long').toLowerCase();
      const isCall = typeNormalized === 'call' || typeNormalized === 'c';
      const sideMult = (sideNormalized === 'long' || sideNormalized === 'buy') ? 1 : -1;
      const bsType = isCall ? 'call' : 'put';

      // Calcular precio teórico en T+0 (Hoy) usando el precio SIMULADO
      const bsToday = calculateGreeks(simulatedSpot, k, t_today, riskFreeRate, iv, bsType);
      pnlToday += (bsToday.price - entry) * qty * sideMult * 100;

      // Calcular precio teórico en T+50%
      const bsHalf = calculateGreeks(simulatedSpot, k, t_half, riskFreeRate, iv, bsType);
      pnlHalf += (bsHalf.price - entry) * qty * sideMult * 100;

      // Calcular al Vencimiento (Valor Intrínseco)
      let intrinsic = 0;
      if (isCall) intrinsic = Math.max(0, simulatedSpot - k);
      else intrinsic = Math.max(0, k - simulatedSpot);
      
      // P&L Vencimiento: (Valor Final - Precio Entrada) * Multiplicador
      // Long: (Intrínseco - Entrada)
      // Short: (Entrada - Intrínseco) -> que es lo mismo que (Intrínseco - Entrada) * -1
      pnlExpiry += (intrinsic - entry) * qty * sideMult * 100;
    });

    rows.push({
      spotPrice: simulatedSpot,
      spotChange: ((simulatedSpot - currentSpot) / currentSpot) * 100,
      today: pnlToday,
      halfLife: pnlHalf,
      expiration: pnlExpiry,
      isCurrentPrice: simulatedSpot === currentSpot,
      isBreakeven: Math.abs(pnlExpiry) < 100 // Umbral visual de breakeven
    });
  }

  return rows;
};

// Helpers visuales
export const getMaxAbsValue = (data: SensitivityScenario[]) => {
  if (!data.length) return 0;
  return Math.max(...data.map(r => Math.max(Math.abs(r.today), Math.abs(r.expiration))));
};

export const getHeatmapColor = (value: number, maxAbs: number) => {
  if (maxAbs === 0) return 'transparent';
  const ratio = Math.max(-1, Math.min(1, value / maxAbs));
  const opacity = 0.15 + 0.85 * Math.abs(ratio); // Mínimo 15% opacidad
  
  return value >= 0 
    ? `rgba(16, 185, 129, ${opacity * 0.5})` // Verde
    : `rgba(239, 68, 68, ${opacity * 0.5})`; // Rojo
};
