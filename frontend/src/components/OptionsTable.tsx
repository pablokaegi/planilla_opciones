'use client';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { useMemo } from 'react';
import { OptionChainResponse, StradleViewRow } from '@/types/options';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

interface OptionsTableProps {
  data: OptionChainResponse;
  spotPrice: number;
}

export default function OptionsTable({ data, spotPrice }: OptionsTableProps) {
  // Transform backend data to straddle view format
  const rowData: StradleViewRow[] = useMemo(() => {
    return data.chain.map(row => ({
      strike: row.strike,
      callBid: row.call_bid,
      callAsk: row.call_ask,
      callLast: row.call_last,
      callVolume: row.call_volume,
      callOI: row.call_open_interest,
      callIV: row.call_iv,
      callDelta: row.call_delta,
      callGamma: row.call_gamma,
      callTheta: row.call_theta,
      callVega: row.call_vega,
      putBid: row.put_bid,
      putAsk: row.put_ask,
      putLast: row.put_last,
      putVolume: row.put_volume,
      putOI: row.put_open_interest,
      putIV: row.put_iv,
      putDelta: row.put_delta,
      putGamma: row.put_gamma,
      putTheta: row.put_theta,
      putVega: row.put_vega,
    }));
  }, [data]);

  // Column definitions for straddle view: [Calls | Strike | Puts]
  const columnDefs: ColDef<StradleViewRow>[] = useMemo(() => [
    // === CALL OPTIONS (Left side) ===
    {
      headerName: 'CALLS',
      children: [
        {
          headerName: 'IV%',
          field: 'callIV',
          width: 80,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(2) || '-',
          cellStyle: { color: '#10b981' }
        },
        {
          headerName: 'Delta',
          field: 'callDelta',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Gamma',
          field: 'callGamma',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Theta',
          field: 'callTheta',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Vega',
          field: 'callVega',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Volume',
          field: 'callVolume',
          width: 90,
        },
        {
          headerName: 'OI',
          field: 'callOI',
          width: 90,
        },
        {
          headerName: 'Bid',
          field: 'callBid',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
          cellStyle: { color: '#60a5fa', fontWeight: 'bold' }
        },
        {
          headerName: 'Ask',
          field: 'callAsk',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
          cellStyle: { color: '#f87171', fontWeight: 'bold' }
        },
        {
          headerName: 'Last',
          field: 'callLast',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
          cellStyle: { fontWeight: 'bold' }
        },
      ]
    },
    
    // === STRIKE (Center) ===
    {
      headerName: 'STRIKE',
      field: 'strike',
      width: 110,
      pinned: 'left',
      cellStyle: (params) => {
        const strike = params.value;
        // Highlight ATM strike (closest to spot)
        if (Math.abs(strike - spotPrice) < 2.5) {
          return { 
            backgroundColor: '#374151', 
            fontWeight: 'bold', 
            fontSize: '16px',
            color: '#fbbf24'
          };
        }
        return { fontWeight: 'bold', fontSize: '15px' };
      },
      valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
    },
    
    // === PUT OPTIONS (Right side) ===
    {
      headerName: 'PUTS',
      children: [
        {
          headerName: 'Last',
          field: 'putLast',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
          cellStyle: { fontWeight: 'bold' }
        },
        {
          headerName: 'Bid',
          field: 'putBid',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
          cellStyle: { color: '#60a5fa', fontWeight: 'bold' }
        },
        {
          headerName: 'Ask',
          field: 'putAsk',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => `$${p.value?.toFixed(2) || '-'}`,
          cellStyle: { color: '#f87171', fontWeight: 'bold' }
        },
        {
          headerName: 'Volume',
          field: 'putVolume',
          width: 90,
        },
        {
          headerName: 'OI',
          field: 'putOI',
          width: 90,
        },
        {
          headerName: 'IV%',
          field: 'putIV',
          width: 80,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(2) || '-',
          cellStyle: { color: '#10b981' }
        },
        {
          headerName: 'Delta',
          field: 'putDelta',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Gamma',
          field: 'putGamma',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Theta',
          field: 'putTheta',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
        {
          headerName: 'Vega',
          field: 'putVega',
          width: 90,
          valueFormatter: (p: ValueFormatterParams) => p.value?.toFixed(4) || '-',
        },
      ]
    },
  ], [spotPrice]);

  return (
    <div className="ag-theme-alpine-dark" style={{ height: '700px', width: '100%' }}>
      <AgGridReact<StradleViewRow>
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
        animateRows={true}
        rowSelection="single"
      />
    </div>
  );
}
