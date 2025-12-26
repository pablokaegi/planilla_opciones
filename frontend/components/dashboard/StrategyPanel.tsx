/**
 * Strategy Panel - Shows selected option legs
 * Fixed panel at bottom of screen
 * Now with Save/Load Strategy functionality
 */
'use client';

import { useStrategyStore, SavedStrategy } from '@/store/strategyStore';
import { X, TrendingUp, TrendingDown, DollarSign, Plus, Minus, Trash2, RefreshCw, Save, FolderOpen, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function StrategyPanel() {
  const { 
    legs, 
    removeLeg, 
    clearStrategy, 
    updateLegQuantity, 
    getMetrics, 
    confirmStrategy,
    savedStrategies,
    saveStrategy,
    loadStrategy,
    deleteStrategy
  } = useStrategyStore();
  const metrics = getMetrics();
  const [mounted, setMounted] = useState(false);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLoadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- SAVE STRATEGY HANDLER ---
  const handleSaveStrategy = () => {
    if (legs.length === 0) {
      alert('No legs to save! Add some options first.');
      return;
    }
    const name = window.prompt('Enter a name for this strategy:', `Strategy ${savedStrategies.length + 1}`);
    if (name !== null) {
      saveStrategy(name);
      alert(`✅ Strategy "${name}" saved!`);
    }
  };

  // --- LOAD STRATEGY HANDLER ---
  const handleLoadStrategy = (strategy: SavedStrategy) => {
    if (legs.length > 0) {
      const confirmLoad = confirm(`This will replace your current ${legs.length} leg(s). Continue?`);
      if (!confirmLoad) return;
    }
    loadStrategy(strategy.id);
    setShowLoadDropdown(false);
  };

  // --- DELETE STRATEGY HANDLER ---
  const handleDeleteStrategy = (e: React.MouseEvent, strategyId: string, strategyName: string) => {
    e.stopPropagation(); // Prevent triggering load
    if (confirm(`Delete "${strategyName}"?`)) {
      deleteStrategy(strategyId);
    }
  };

  // --- FUNCIÓN NUCLEAR PARA LIMPIAR MEMORIA ---
  const handleHardReset = () => {
    if (confirm('⚠️ ¿HARD RESET?\n\nEsto borrará toda la memoria local, eliminará "datos zombis" y reiniciará la página.\n\nÚsalo si ves gráficos planos o números irreales.')) {
      clearStrategy(); // Limpiar store de Zustand
      localStorage.clear(); // Borrar localStorage del navegador
      sessionStorage.clear(); // Borrar sessionStorage
      window.location.reload(); // Recarga forzada de la página
    }
  };

  // Format date for display
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted) return null;

  // Estado Vacío (Empty State)
  if (!legs || legs.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 z-50">
        <div className="max-w-[1800px] mx-auto flex justify-between items-center">
          <span className="text-gray-500 text-sm">
            💡 Click on <span className="text-blue-400">Bid</span> or <span className="text-blue-400">Ask</span> in the grid to build a strategy.
          </span>
          
          {/* Botón de Emergencia visible incluso si no hay patas visibles */}
          <button 
            onClick={handleHardReset}
            className="flex items-center gap-2 px-3 py-1 bg-red-900/20 hover:bg-red-900/40 text-red-500 text-xs border border-red-900/50 rounded transition-colors"
            title="Borrar caché y reiniciar"
          >
            <RefreshCw className="w-3 h-3" /> Fix Glitches (Reset)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 border-blue-600 shadow-2xl z-50">
      <div className="max-w-[1800px] mx-auto p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          
          {/* Left: Title & Count */}
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-white tracking-tight">Strategy Builder</h3>
            <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full border border-gray-700">
              {legs.length} leg{legs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Right: Metrics & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Net Cost Metric */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Net Cost</span>
                <span className={`font-mono font-bold ${metrics.netCost >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  ${Math.abs(metrics.netCost).toFixed(2)} {metrics.netCost >= 0 ? 'Dr' : 'Cr'}
                </span>
              </div>
            </div>

            {/* Delta Metric */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700">
              {metrics.netDelta >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-gray-500 uppercase font-bold">Delta</span>
                <span className="font-mono text-gray-200">{metrics.netDelta.toFixed(2)}</span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-700 mx-2"></div>

            {/* Save/Load Buttons */}
            <button
              onClick={handleSaveStrategy}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded border border-gray-700 hover:border-gray-600 transition-colors"
              title="Save current strategy"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            {/* Load Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLoadDropdown(!showLoadDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded border border-gray-700 hover:border-gray-600 transition-colors"
                title="Load saved strategy"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Load</span>
                {savedStrategies.length > 0 && (
                  <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {savedStrategies.length}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showLoadDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showLoadDropdown && (
                <div className="absolute bottom-full mb-2 right-0 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                  <div className="p-2 border-b border-gray-700">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saved Strategies</span>
                  </div>
                  {savedStrategies.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No saved strategies yet.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {savedStrategies.map((strategy) => (
                        <div
                          key={strategy.id}
                          onClick={() => handleLoadStrategy(strategy)}
                          className="flex items-center justify-between p-3 hover:bg-gray-700/50 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">{strategy.name}</div>
                            <div className="text-xs text-gray-500">
                              {strategy.legs.length} leg{strategy.legs.length !== 1 ? 's' : ''} • {formatDate(strategy.date)}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteStrategy(e, strategy.id, strategy.name)}
                            className="ml-2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                            title="Delete strategy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-gray-700 mx-2"></div>

            {/* Action Buttons */}
            <button
              onClick={handleHardReset}
              className="p-2 text-red-500 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
              title="⚠️ RESET MEMORY (Fix bugs)"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              onClick={confirmStrategy}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded shadow-lg shadow-blue-900/20 transition-all hover:translate-y-[-1px]"
            >
              Analyze <span className="hidden sm:inline">Strategy</span> →
            </button>
          </div>
        </div>

        {/* Legs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {legs.map((leg) => (
            <div
              key={leg.id}
              className="group relative bg-gray-800 rounded border border-gray-700 p-3 hover:border-gray-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      leg.side === 'long' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>
                      {leg.side === 'long' ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {leg.type.toUpperCase()} {leg.strike}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    {leg.symbol} @ ${leg.price.toFixed(2)}
                  </div>
                </div>

                {/* Quantity & Remove */}
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeLeg(leg.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center bg-gray-900 rounded border border-gray-700">
                    <button
                      onClick={() => updateLegQuantity(leg.id, Math.max(1, leg.quantity - 1))}
                      className="px-1.5 py-0.5 hover:bg-gray-700 text-gray-400"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-xs font-mono text-white border-x border-gray-700">
                      {leg.quantity}
                    </span>
                    <button
                      onClick={() => updateLegQuantity(leg.id, leg.quantity + 1)}
                      className="px-1.5 py-0.5 hover:bg-gray-700 text-gray-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
