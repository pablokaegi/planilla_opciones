import { StrategyLeg } from '@/store/strategyStore';

// --- FUNCIONES ESTADÍSTICAS (Para Probabilidad de Ganancia) ---

// Función de Distribución Acumulada Normal Estándar (CDF)
// Aproximación de alta precisión para evitar librerías externas pesadas
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// --- GENERADORES DE RANGO Y PAYOFF ---

// 1. Generar el eje X (Precios del Subyacente)
export const generateSpotRange = (center: number, percent: number, steps: number): number[] => {
  if (!center || center <= 0) return [];
  const start = center * (1 - percent / 100);
  const end = center * (1 + percent / 100);
  const stepSize = (end - start) / (steps - 1);
  
  // Crear array de precios [start, ..., center, ..., end]
  return Array.from({ length: steps }, (_, i) => start + i * stepSize);
};

// 2. Calcular P&L para CADA punto del gráfico (El gráfico real)
export const calculateStrategyPayoff = (legs: StrategyLeg[], spotRange: number[]): number[] => {
  return spotRange.map(spot => {
    let totalPnL = 0;

    legs.forEach(leg => {
      const quantity = Number(leg.quantity) || 1;
      const strike = Number(leg.strike) || 0;
      const entryPrice = Number(leg.price) || 0;
      
      // BLINDAJE: Normalizar texto a minúsculas para evitar error 'Call' vs 'call'
      const typeNormalized = (leg.type || 'call').toLowerCase();
      const sideNormalized = (leg.side || 'long').toLowerCase();
      
      const isCall = typeNormalized === 'call' || typeNormalized === 'c';
      const isLong = sideNormalized === 'long' || sideNormalized === 'buy';

      // Valor Intrínseco al vencimiento
      let intrinsic = 0;
      if (isCall) {
        intrinsic = Math.max(0, spot - strike);
      } else { // Put
        intrinsic = Math.max(0, strike - spot);
      }

      // P&L = (Valor Final - Costo Inicial)
      // Multiplicador x100 por contrato estándar
      if (isLong) {
        totalPnL += (intrinsic - entryPrice) * quantity * 100;
      } else {
        totalPnL += (entryPrice - intrinsic) * quantity * 100;
      }
    });

    return totalPnL;
  });
};

// 3. Calcular Probabilidad de Ganancia (PoP)
export const calculateProbabilityOfProfit = (
  legs: StrategyLeg[], 
  currentSpot: number, 
  avgIV: number, 
  daysToExpiry: number
): number => {
  if (legs.length === 0) return 0;
  
  // Encontrar breakevens (donde cruzamos el 0)
  const breakevens = calculateBreakevens(legs, currentSpot);
  
  // Si no hay breakevens, o siempre ganamos (100%) o siempre perdemos (0%)
  if (breakevens.length === 0) {
    const samplePnL = calculateStrategyPayoff(legs, [currentSpot])[0];
    return samplePnL > 0 ? 1 : 0;
  }

  // Parámetros para Black-Scholes (distribución log-normal de precios)
  const t = Math.max(daysToExpiry / 365, 0.001);
  const sigma = avgIV || 0.4; // Default IV 40%
  const volTerm = sigma * Math.sqrt(t);
  const riskFree = 0.26; // Tasa local aprox

  // Función para calcular probabilidad de que el precio esté POR DEBAJO de K
  // P(S_t < K) = N(-d2)
  const probBelow = (priceTarget: number) => {
    const d2 = (Math.log(currentSpot / priceTarget) + (riskFree - 0.5 * sigma * sigma) * t) / volTerm;
    return normalCDF(d2); // Probabilidad de terminar debajo de priceTarget
  };

  // Lógica simplificada robusta:
  // Ordenar breakevens
  const sortedBE = [...breakevens].sort((a, b) => a - b);
  
  // Chequear P&L en el precio actual para saber si estamos en zona de ganancia
  const currentPnL = calculateStrategyPayoff(legs, [currentSpot])[0];

  // Escenario 1: Un solo Breakeven (Direccional: Call o Put simple)
  if (sortedBE.length === 1) {
    const probBelowBE = probBelow(sortedBE[0]);
    
    // Si ganamos AHORA (ej. Short Put OTM), ganamos si precio > BE (si es put) o < BE (si es call ITM vendida)
    // Simplificación: Miramos un punto arriba y abajo
    const pnlUp = calculateStrategyPayoff(legs, [sortedBE[0] * 1.01])[0];
    
    if (pnlUp > 0) { 
      // Ganancia hacia arriba (Bullish) -> Probabilidad es 1 - P(S < BE)
      return 1 - probBelowBE; 
    } else {
      // Ganancia hacia abajo (Bearish) -> Probabilidad es P(S < BE)
      return probBelowBE;
    }
  }

  // Escenario 2: Dos Breakevens (Estrategias de Rango: Iron Condor, Strangle)
  if (sortedBE.length >= 2) {
    const lower = sortedBE[0];
    const upper = sortedBE[sortedBE.length - 1];
    
    // Usemos lógica estándar N(d2)
    const getD2 = (K: number) => (Math.log(currentSpot / K) + (riskFree - 0.5 * sigma * sigma) * t) / volTerm;
    const probSgtK = (K: number) => normalCDF(getD2(K)); // Prob S > K

    const probInBetween = probSgtK(lower) - probSgtK(upper); // Probabilidad de quedar en el medio

    // Si es estrategia de Crédito (Iron Condor), ganamos en el medio
    // Si es estrategia de Débito (Long Strangle), ganamos afuera
    
    // Testear el centro
    const centerPrice = (lower + upper) / 2;
    const pnlCenter = calculateStrategyPayoff(legs, [centerPrice])[0];

    if (pnlCenter > 0) return Math.abs(probInBetween); // Ganamos adentro
    return 1 - Math.abs(probInBetween); // Ganamos afuera
  }

  return 0.5; // Fallback
};

// 4. Calcular Puntos de Equilibrio (Cruces por Cero)
export const calculateBreakevens = (legs: StrategyLeg[], currentSpot: number): number[] => {
  // Escanear un rango amplio para encontrar cambios de signo
  const range = generateSpotRange(currentSpot, 100, 200); // ±100%
  const payoffs = calculateStrategyPayoff(legs, range);
  const breakevens: number[] = [];

  for (let i = 1; i < payoffs.length; i++) {
    const y1 = payoffs[i - 1];
    const y2 = payoffs[i];
    
    // Si hay cambio de signo, hay un breakeven
    if ((y1 > 0 && y2 < 0) || (y1 < 0 && y2 > 0)) {
      // Interpolación lineal para encontrar el precio exacto x donde y=0
      const x1 = range[i - 1];
      const x2 = range[i];
      // Fórmula de la recta: x = x1 + (0 - y1) * (x2 - x1) / (y2 - y1)
      const zeroPrice = x1 + (0 - y1) * (x2 - x1) / (y2 - y1);
      breakevens.push(zeroPrice);
    }
  }
  return breakevens;
};

// 5. Métricas Agregadas para el Panel
export const calculateStrategyMetrics = (
  legs: StrategyLeg[], 
  currentSpot: number, 
  daysToExpiry: number
) => {
  let netCost = 0;
  let netDelta = 0;
  let netGamma = 0;
  let netTheta = 0;
  let netVega = 0;
  let totalIV = 0;

  legs.forEach(leg => {
    const qty = Number(leg.quantity);
    const price = Number(leg.price);
    const sideNormalized = (leg.side || 'long').toLowerCase();
    const multiplier = (sideNormalized === 'long' || sideNormalized === 'buy') ? 1 : -1;

    netCost += price * qty * 100 * multiplier;
    
    if (leg.delta) netDelta += leg.delta * qty * 100 * multiplier;
    if (leg.gamma) netGamma += leg.gamma * qty * 100 * multiplier;
    if (leg.theta) netTheta += leg.theta * qty * 100 * multiplier;
    if (leg.vega) netVega += leg.vega * qty * 100 * multiplier;
    if (leg.iv) totalIV += leg.iv;
  });

  const range = generateSpotRange(currentSpot, 50, 100);
  const payoffs = calculateStrategyPayoff(legs, range);
  
  return {
    netCost,
    maxProfit: Math.max(...payoffs),
    maxLoss: Math.min(...payoffs),
    breakevens: calculateBreakevens(legs, currentSpot),
    probabilityOfProfit: calculateProbabilityOfProfit(legs, currentSpot, totalIV/legs.length || 0.4, daysToExpiry),
    netDelta,
    netGamma,
    netTheta,
    netVega,
    capitalAtRisk: Math.abs(netCost),
    returnOnRisk: netCost !== 0 ? (Math.max(...payoffs) / Math.abs(netCost)) * 100 : 0,
    riskRewardRatio: Math.min(...payoffs) !== 0 ? Math.max(...payoffs) / Math.abs(Math.min(...payoffs)) : 0
  };
};
