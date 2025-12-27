/**
 * Option Chain Grid - PRODUCTION READY
 * Unified Expiration Logic (Clean UI)
 */
'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useStrategyStore } from '@/store/strategyStore';
import { useOptionChain } from '@/lib/query_client';

interface OptionChainGridProps {
  ticker: string;
  daysToExpiry: number;
}

// --- DICCIONARIO DE UNIFICACIÓN DE MESES ---
// Convierte códigos mixtos de BYMA a formato estándar de 3 letras
const MONTH_MAP: Record<string, string> = {
  'E': 'ENE', 'EN': 'ENE', 'JA': 'ENE',
  'F': 'FEB', 'FE': 'FEB', 'FB': 'FEB',
  'M': 'MAR', 'MA': 'MAR', 'MR': 'MAR',
  'A': 'ABR', 'AB': 'ABR', 'AP': 'ABR',
  'Y': 'MAY', 'MY': 'MAY',
  'J': 'JUN', 'JU': 'JUN', 'JN': 'JUN',
  'L': 'JUL', 'JL': 'JUL',
  'G': 'AGO', 'AG': 'AGO',
  'S': 'SEP', 'SE': 'SEP',
  'O': 'OCT', 'OC': 'OCT',
  'N': 'NOV', 'NO': 'NOV',
  'D': 'DIC', 'DI': 'DIC'
};

// Helper: Normaliza el vencimiento
const getNormalizedExpiration = (ticker: string | null): string => {
  if (!ticker) return 'UNK';
  const match = ticker.match(/([A-Z]{1,2})$/);
  if (!match) return 'UNK';
  const rawCode = match[0];
  return MONTH_MAP[rawCode] || rawCode;
};

// Componente de Precio Interactivo
const PriceCellRenderer = (params: ICellRendererParams & { 
  onPriceClick: (price: number, side: 'long' | 'short') => void;
  side: 'long' | 'short';
  ticker: string | null;
}) => {
  const value = params.value;
  if (value === null || value === undefined) {
    return <span className="text-gray-600">—</span>;
  }
  return (
    <button
      onClick={() => params.onPriceClick(value, params.side)}
      title={`Contract: ${params.ticker || 'Unknown'}`} 
      className="w-full h-full px-2 py-1 text-center hover:bg-blue-600 hover:text-white transition-colors rounded font-mono"
    >
      ${value.toFixed(2)}
    </button>
  );
};

export default function OptionChainGrid({ ticker, daysToExpiry }: OptionChainGridProps) {
  const addLeg = useStrategyStore((state) => state.addLeg);
  const setCurrentSpot = useStrategyStore((state) => state.setCurrentSpot);
  const setDaysToExpiry = useStrategyStore((state) => state.setDaysToExpiry);

  const { data: chainData, isLoading, error } = useOptionChain(ticker, daysToExpiry);

  const [selectedExp, setSelectedExp] = useState<string>('');
  const [availableExps, setAvailableExps] = useState<string[]>([]);

  // 1. Procesar datos al cargar
  useEffect(() => {
    if (chainData && chainData.chain) {
      setCurrentSpot(chainData.spot_price);
      setDaysToExpiry(daysToExpiry);

      const expirations = new Set<string>();
      
      chainData.chain.forEach(row => {
        if (row.call_ticker) expirations.add(getNormalizedExpiration(row.call_ticker));
        if (row.put_ticker) expirations.add(getNormalizedExpiration(row.put_ticker));
      });

      // Ordenar alfabéticamente (se puede mejorar a orden cronológico si se desea)
      const sortedExps = Array.from(expirations).sort();
      setAvailableExps(sortedExps);
      
      // Seleccionar el primero por defecto si no hay nada seleccionado
      if (sortedExps.length > 0 && !selectedExp) {
        setSelectedExp(sortedExps[0]);
      }
    }
  }, [chainData, daysToExpiry, setCurrentSpot, setDaysToExpiry]);

  // 2. Filtrar filas
  const filteredRowData = useMemo(() => {
    if (!chainData || !chainData.chain) return [];
    if (!selectedExp) return chainData.chain;

    return chainData.chain.filter(row => {
      const callExp = getNormalizedExpiration(row.call_ticker);
      const putExp = getNormalizedExpiration(row.put_ticker);
      return callExp === selectedExp || putExp === selectedExp;
    });
  }, [chainData, selectedExp]);

  // 3. Manejador de Clics
  const handlePriceClick = useCallback((strike: number, type: 'call' | 'put', price: number, side: 'long' | 'short', optionTicker: string | null, greeks?: any) => {
      addLeg({ symbol: optionTicker || ticker, strike, type, side, price, quantity: 1, ...greeks });
  }, [addLeg, ticker]);

  // 4. Definición de Columnas
  const columnDefs = useMemo<ColDef[]>(() => [
      // CALLS
      { headerName: 'CALLS', headerClass: 'ag-header-group-calls', children: [
          { headerName: 'Bid', field: 'call_bid', width: 90, cellRenderer: (p: any) => <PriceCellRenderer {...p} side="short" ticker={p.data.call_ticker} onPriceClick={(pr, s) => handlePriceClick(p.data.strike, 'call', pr, s, p.data.call_ticker, {delta: p.data.call_delta})} />, cellClass: 'text-green-300 cursor-pointer' },
          { headerName: 'Ask', field: 'call_ask', width: 90, cellRenderer: (p: any) => <PriceCellRenderer {...p} side="long" ticker={p.data.call_ticker} onPriceClick={(pr, s) => handlePriceClick(p.data.strike, 'call', pr, s, p.data.call_ticker, {delta: p.data.call_delta})} />, cellClass: 'text-green-300 cursor-pointer' },
          { headerName: 'IV', field: 'call_iv', width: 60, valueFormatter: (p: any) => p.value ? `${(p.value * 100).toFixed(0)}%` : '', cellClass: 'text-gray-500 text-xs' },
          { headerName: 'Δ', field: 'call_delta', width: 60, valueFormatter: (p: any) => p.value?.toFixed(2) ?? '', cellClass: 'text-gray-400 font-mono text-xs' },
      ]},
      // STRIKE
      { headerName: 'Strike', field: 'strike', width: 90, pinned: 'left', cellClass: 'font-bold text-yellow-400 text-center bg-gray-900 border-x border-gray-700', suppressMovable: true },
      // PUTS
      { headerName: 'PUTS', headerClass: 'ag-header-group-puts', children: [
          { headerName: 'Δ', field: 'put_delta', width: 60, valueFormatter: (p: any) => p.value?.toFixed(2) ?? '', cellClass: 'text-gray-400 font-mono text-xs' },
          { headerName: 'IV', field: 'put_iv', width: 60, valueFormatter: (p: any) => p.value ? `${(p.value * 100).toFixed(0)}%` : '', cellClass: 'text-gray-500 text-xs' },
          { headerName: 'Bid', field: 'put_bid', width: 90, cellRenderer: (p: any) => <PriceCellRenderer {...p} side="short" ticker={p.data.put_ticker} onPriceClick={(pr, s) => handlePriceClick(p.data.strike, 'put', pr, s, p.data.put_ticker, {delta: p.data.put_delta})} />, cellClass: 'text-red-300 cursor-pointer' },
          { headerName: 'Ask', field: 'put_ask', width: 90, cellRenderer: (p: any) => <PriceCellRenderer {...p} side="long" ticker={p.data.put_ticker} onPriceClick={(pr, s) => handlePriceClick(p.data.strike, 'put', pr, s, p.data.put_ticker, {delta: p.data.put_delta})} />, cellClass: 'text-red-300 cursor-pointer' },
      ]},
  ], [handlePriceClick]);

  const defaultColDef = useMemo(() => ({ sortable: true, filter: false, resizable: true, suppressMenu: true }), []);

  if (isLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  if (error) return <div className="text-red-500 text-center p-10 bg-red-900/20 border border-red-500 rounded">Error loading chain</div>;

  return (
    <div className="flex flex-col h-full w-full">
      {/* HEADER & FILTER */}
      <div className="bg-gray-800/50 p-3 mb-2 rounded border border-gray-700 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
            <span className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Spot</span>
            <div className="text-white font-mono text-xl font-bold tracking-tight">
              ${chainData?.spot_price?.toFixed(2) ?? '0.00'}
            </div>
        </div>
        
        <div className="flex items-center gap-3">
             <label className="text-gray-400 text-sm font-medium">Vencimiento:</label>
             <div className="relative">
               <select 
                  value={selectedExp} 
                  onChange={e => setSelectedExp(e.target.value)}
                  className="appearance-none bg-gray-900 hover:bg-gray-800 text-white border border-gray-600 rounded px-4 py-1.5 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors cursor-pointer min-w-[100px]"
               >
                   {availableExps.map(e => <option key={e} value={e}>{e}</option>)}
               </select>
               {/* Icono del select */}
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
               </div>
             </div>
        </div>
      </div>

      {/* GRID CONTAINER - FIX CRÍTICO 
         Usamos height fijo (600px) para asegurar visibilidad.
         Quitamos 'flex-1' que puede fallar si el padre no es flex.
      */}
      <div 
        className="ag-theme-alpine-dark w-full border border-gray-800 rounded overflow-hidden" 
        style={{ height: '600px', width: '100%' }} // <--- ESTO ES LO QUE ARREGLA EL PROBLEMA
      >
        <AgGridReact
          rowData={filteredRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          headerHeight={36}
          rowHeight={32}
          animateRows={true}
          tooltipShowDelay={0}
        />
      </div>
    </div>
  );
}
