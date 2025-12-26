/**
 * Strategy Store - Global State Management with Zustand
 * Manages selected option legs for strategy building with computed metrics
 */
import { create } from 'zustand';
import { calculateStrategyMetrics } from '@/utils/strategyMath';

export interface StrategyLeg {
  id: string;
  symbol: string;
  strike: number;
  type: 'call' | 'put';
  side: 'long' | 'short'; // long = buy (ask), short = sell (bid)
  price: number;
  quantity: number;
  // Greeks for analysis
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  iv?: number;
}

interface StrategyStore {
  legs: StrategyLeg[];
  currentSpot: number;
  daysToExpiry: number;
  confirmedStrategy: StrategyLeg[] | null; // Strategy ready for analysis
  
  // Actions
  addLeg: (leg: Omit<StrategyLeg, 'id'>) => void;
  removeLeg: (id: string) => void;
  updateLegQuantity: (id: string, quantity: number) => void;
  clearStrategy: () => void;
  setCurrentSpot: (spot: number) => void;
  setDaysToExpiry: (days: number) => void;
  confirmStrategy: () => void;
  clearConfirmedStrategy: () => void;
  
  // Computed values
  getMetrics: () => ReturnType<typeof calculateStrategyMetrics>;
}

export const useStrategyStore = create<StrategyStore>((set, get) => ({
  legs: [],
  currentSpot: 0,
  daysToExpiry: 0,
  confirmedStrategy: null,

  addLeg: (leg) => {
    const id = `${leg.symbol}-${leg.type}-${leg.strike}-${leg.side}-${Date.now()}`;
    set((state) => ({
      legs: [...(state.legs || []), { ...leg, id }],
    }));
  },

  removeLeg: (id) => {
    set((state) => ({
      legs: (state.legs || []).filter((leg) => leg.id !== id),
    }));
  },

  updateLegQuantity: (id, quantity) => {
    set((state) => ({
      legs: (state.legs || []).map((leg) =>
        leg.id === id ? { ...leg, quantity } : leg
      ),
    }));
  },

  clearStrategy: () => {
    set({ legs: [] });
  },

  setCurrentSpot: (spot) => {
    set({ currentSpot: spot });
  },

  setDaysToExpiry: (days) => {
    set({ daysToExpiry: days });
  },

  confirmStrategy: () => {
    const { legs } = get();
    set({ confirmedStrategy: [...legs] });
  },

  clearConfirmedStrategy: () => {
    set({ confirmedStrategy: null });
  },

  // Computed: Get all strategy metrics
  // Usa confirmedStrategy si existe (para análisis), sino usa legs (para builder)
  getMetrics: () => {
    const { legs, confirmedStrategy, currentSpot, daysToExpiry } = get();
    const activeLegs = confirmedStrategy || legs || [];
    return calculateStrategyMetrics(activeLegs, currentSpot, daysToExpiry);
  },
}));
