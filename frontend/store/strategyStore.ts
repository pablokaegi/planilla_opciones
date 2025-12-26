/**
 * Strategy Store - Global State Management with Zustand
 * Manages selected option legs for strategy building with computed metrics
 * Now with persistence to LocalStorage for Save/Load functionality
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

export interface SavedStrategy {
  id: string;
  name: string;
  date: string; // ISO date string
  legs: StrategyLeg[];
}

interface StrategyStore {
  legs: StrategyLeg[];
  currentSpot: number;
  daysToExpiry: number;
  confirmedStrategy: StrategyLeg[] | null; // Strategy ready for analysis
  savedStrategies: SavedStrategy[]; // Persisted saved strategies
  
  // Actions
  addLeg: (leg: Omit<StrategyLeg, 'id'>) => void;
  removeLeg: (id: string) => void;
  updateLegQuantity: (id: string, quantity: number) => void;
  clearStrategy: () => void;
  setCurrentSpot: (spot: number) => void;
  setDaysToExpiry: (days: number) => void;
  confirmStrategy: () => void;
  clearConfirmedStrategy: () => void;
  
  // Save/Load Actions
  saveStrategy: (name: string) => void;
  loadStrategy: (id: string) => void;
  deleteStrategy: (id: string) => void;
  
  // Computed values
  getMetrics: () => ReturnType<typeof calculateStrategyMetrics>;
}

export const useStrategyStore = create<StrategyStore>()(
  persist(
    (set, get) => ({
      legs: [],
      currentSpot: 0,
      daysToExpiry: 0,
      confirmedStrategy: null,
      savedStrategies: [],

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
        set({ legs: [], confirmedStrategy: null });
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

      // Save current strategy to savedStrategies array
      saveStrategy: (name: string) => {
        const { legs, savedStrategies } = get();
        if (legs.length === 0) return; // Don't save empty strategies
        
        const newStrategy: SavedStrategy = {
          id: crypto.randomUUID ? crypto.randomUUID() : `strategy-${Date.now()}`,
          name: name.trim() || `Strategy ${savedStrategies.length + 1}`,
          date: new Date().toISOString(),
          legs: [...legs],
        };
        
        set({
          savedStrategies: [...savedStrategies, newStrategy],
        });
      },

      // Load a saved strategy by ID into current legs
      loadStrategy: (id: string) => {
        const { savedStrategies } = get();
        const strategy = savedStrategies.find((s) => s.id === id);
        
        if (strategy) {
          set({
            legs: [...strategy.legs],
            confirmedStrategy: null, // Reset confirmed strategy when loading
          });
        }
      },

      // Delete a saved strategy by ID
      deleteStrategy: (id: string) => {
        set((state) => ({
          savedStrategies: state.savedStrategies.filter((s) => s.id !== id),
        }));
      },

      // Computed: Get all strategy metrics
      // Usa confirmedStrategy si existe (para análisis), sino usa legs (para builder)
      getMetrics: () => {
        const { legs, confirmedStrategy, currentSpot, daysToExpiry } = get();
        const activeLegs = confirmedStrategy || legs || [];
        return calculateStrategyMetrics(activeLegs, currentSpot, daysToExpiry);
      },
    }),
    {
      name: 'options-strategy-storage', // LocalStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist savedStrategies to avoid issues with transient state
      partialize: (state) => ({
        savedStrategies: state.savedStrategies,
      }),
    }
  )
);
