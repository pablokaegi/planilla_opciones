/**
 * Option Chain Grid - Straddle View with AG Grid
 * Interactive: Click Bid/Ask to add to strategy
 */
'use client';

import { useMemo, useCallback, useEffect } from 'react';
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

// Clickable Price Cell Renderer
const PriceCellRenderer = (params: ICellRendererParams & { 
  onPriceClick: (price: number, side: 'long' | 'short') => void;
  side: 'long' | 'short';
}) => {
  const value = params.value;
  if (value === null || value === undefined) {
    return <span className="text-gray-600">—</span>;
  }

  return (
    <button
      onClick={() => params.onPriceClick(value, params.side)}
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

  // Fetch option chain data
  const { data: chainData, isLoading, error } = useOptionChain(ticker, daysToExpiry);

  // Update store with current spot and DTE (must use useEffect, not useMemo)
  useEffect(() => {
    if (chainData) {
      setCurrentSpot(chainData.spot_price);
      setDaysToExpiry(daysToExpiry);
    }
  }, [chainData, daysToExpiry, setCurrentSpot, setDaysToExpiry]);

  // Handler for price clicks
  const handlePriceClick = useCallback(
    (
      strike: number,
      type: 'call' | 'put',
      price: number,
      side: 'long' | 'short',
      greeks?: {
        delta?: number;
        gamma?: number;
        theta?: number;
        vega?: number;
        iv?: number;
      }
    ) => {
      addLeg({
        symbol: ticker,
        strike,
        type,
        side,
        price,
        quantity: 1,
        ...greeks,
      });
    },
    [addLeg, ticker]
  );

  // Column Definitions - Straddle Layout
  const columnDefs = useMemo<ColDef[]>(
    () => [
      // CALLS SECTION (Left Side)
      {
        headerName: 'CALLS',
        children: [
          {
            headerName: 'Bid',
            field: 'call_bid',
            width: 100,
            cellRenderer: (params: ICellRendererParams) => (
              <PriceCellRenderer
                {...params}
                side="short"
                onPriceClick={(price, side) =>
                  handlePriceClick(
                    params.data.strike,
                    'call',
                    price,
                    side,
                    {
                      delta: params.data.call_delta,
                      gamma: params.data.call_gamma,
                      theta: params.data.call_theta,
                      vega: params.data.call_vega,
                      iv: params.data.call_iv,
                    }
                  )
                }
              />
            ),
            cellClass: 'cursor-pointer',
          },
          {
            headerName: 'Ask',
            field: 'call_ask',
            width: 100,
            cellRenderer: (params: ICellRendererParams) => (
              <PriceCellRenderer
                {...params}
                side="long"
                onPriceClick={(price, side) =>
                  handlePriceClick(
                    params.data.strike,
                    'call',
                    price,
                    side,
                    {
                      delta: params.data.call_delta,
                      gamma: params.data.call_gamma,
                      theta: params.data.call_theta,
                      vega: params.data.call_vega,
                      iv: params.data.call_iv,
                    }
                  )
                }
              />
            ),
            cellClass: 'cursor-pointer',
          },
          {
            headerName: 'IV',
            field: 'call_iv',
            width: 80,
            valueFormatter: (params: any) =>
              params.value ? `${(params.value * 100).toFixed(1)}%` : '—',
            cellClass: 'text-gray-400',
          },
          {
            headerName: 'Delta',
            field: 'call_delta',
            width: 90,
            valueFormatter: (params: any) =>
              params.value ? params.value.toFixed(3) : '—',
            cellClass: 'text-green-400 font-mono',
          },
        ],
      },

      // STRIKE (Center)
      {
        headerName: 'Strike',
        field: 'strike',
        width: 120,
        cellClass: 'font-bold text-yellow-400 text-center',
        valueFormatter: (params) => `$${params.value.toFixed(0)}`,
        pinned: 'left',
      },

      // PUTS SECTION (Right Side)
      {
        headerName: 'PUTS',
        children: [
          {
            headerName: 'Delta',
            field: 'put_delta',
            width: 90,
            valueFormatter: (params: any) =>
              params.value ? params.value.toFixed(3) : '—',
            cellClass: 'text-red-400 font-mono',
          },
          {
            headerName: 'IV',
            field: 'put_iv',
            width: 80,
            valueFormatter: (params: any) =>
              params.value ? `${(params.value * 100).toFixed(1)}%` : '—',
            cellClass: 'text-gray-400',
          },
          {
            headerName: 'Bid',
            field: 'put_bid',
            width: 100,
            cellRenderer: (params: ICellRendererParams) => (
              <PriceCellRenderer
                {...params}
                side="short"
                onPriceClick={(price, side) =>
                  handlePriceClick(
                    params.data.strike,
                    'put',
                    price,
                    side,
                    {
                      delta: params.data.put_delta,
                      gamma: params.data.put_gamma,
                      theta: params.data.put_theta,
                      vega: params.data.put_vega,
                      iv: params.data.put_iv,
                    }
                  )
                }
              />
            ),
            cellClass: 'cursor-pointer',
          },
          {
            headerName: 'Ask',
            field: 'put_ask',
            width: 100,
            cellRenderer: (params: ICellRendererParams) => (
              <PriceCellRenderer
                {...params}
                side="long"
                onPriceClick={(price, side) =>
                  handlePriceClick(
                    params.data.strike,
                    'put',
                    price,
                    side,
                    {
                      delta: params.data.put_delta,
                      gamma: params.data.put_gamma,
                      theta: params.data.put_theta,
                      vega: params.data.put_vega,
                      iv: params.data.put_iv,
                    }
                  )
                }
              />
            ),
            cellClass: 'cursor-pointer',
          },
        ],
      },
    ],
    [handlePriceClick]
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: false,
      resizable: true,
    }),
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
        <p className="text-red-400 font-semibold mb-2">Error loading option chain</p>
        <p className="text-gray-400 text-sm">
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </p>
      </div>
    );
  }

  // No data
  if (!chainData || !chainData.chain || chainData.chain.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">No options data available for {ticker}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Info Bar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">Spot Price:</span>
            <span className="ml-2 text-green-400 font-semibold">${chainData.spot_price.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-400">Expiration:</span>
            <span className="ml-2 text-white font-semibold">{chainData.expiration_date}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          💡 Click <span className="text-blue-400">Bid</span> (short) or <span className="text-blue-400">Ask</span> (long)
        </p>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine-dark h-full w-full">
        <AgGridReact
          rowData={chainData.chain}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          domLayout="autoHeight"
          suppressCellFocus={true}
          headerHeight={40}
          rowHeight={40}
        />
      </div>
    </div>
  );
}
