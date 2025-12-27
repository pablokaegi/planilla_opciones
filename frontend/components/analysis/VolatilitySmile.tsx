/**
 * VolatilitySmile.tsx - Visualización de la Sonrisa de Volatilidad
 * Muestra la IV (Implied Volatility) a través de los strikes.
 */
'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Scatter
} from 'recharts';

interface VolatilityPoint {
  strike: number;
  iv: number;
  option_type: 'call' | 'put';
}

// Fetcher function
const fetchSmile = async (ticker: string) => {
  const res = await fetch(`http://localhost:8000/api/v1/chain/${ticker}/smile`);
  if (!res.ok) throw new Error('Failed to fetch smile data');
  return res.json();
};

export default function VolatilitySmile({ symbol, currentSpot }: { symbol: string, currentSpot: number }) {
  
  const { data: smilePoints, isLoading } = useQuery<VolatilityPoint[]>({
    queryKey: ['smile', symbol],
    queryFn: () => fetchSmile(symbol),
    staleTime: 60000, // 1 minuto
  });

  // Preparar datos para el gráfico
  const chartData = useMemo(() => {
    if (!smilePoints) return [];
    
    // Filtrar valores locos (> 200% IV) para que el gráfico no se rompa
    return smilePoints
        .filter(p => p.iv > 0 && p.iv < 5.0) 
        .map(p => ({
            strike: p.strike,
            iv: p.iv * 100, // Convertir a porcentaje
            type: p.option_type
        }));
  }, [smilePoints]);

  if (isLoading) {
    return <div className="h-[300px] flex items-center justify-center text-gray-500">Cargando Sonrisa de Volatilidad...</div>;
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px] flex items-center justify-center">
        <div className="text-center">
            <p className="text-gray-400 font-bold">No hay datos de Volatilidad</p>
            <p className="text-xs text-gray-500 mt-2">El mercado puede estar cerrado o sin liquidez.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 h-[400px]">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-white">Volatility Smile</h3>
        <p className="text-xs text-gray-500 mt-1">Implied Volatility vs Strike Price</p>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="smileGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          
          <XAxis
            dataKey="strike"
            type="number"
            domain={['auto', 'auto']}
            tickCount={8}
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={(val) => `$${val}`}
            label={{ value: 'Strike', position: 'insideBottom', offset: -5, fill: '#6b7280', fontSize: 10 }}
          />
          
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickFormatter={(val) => `${val.toFixed(0)}%`}
            label={{ value: 'Implied Volatility (%)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 10 }}
          />

          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'IV']}
            labelFormatter={(label) => `Strike: $${label}`}
          />

          {/* Línea de Spot Actual */}
          <ReferenceLine x={currentSpot} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'SPOT', fill: '#10b981', fontSize: 10 }} />

          {/* Curva de Sonrisa (Línea suavizada) */}
          <Line 
            type="monotone" 
            dataKey="iv" 
            stroke="url(#smileGradient)" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#fff' }}
          />
          
          {/* Puntos individuales (Scatter para ver liquidez real) */}
          <Scatter dataKey="iv" fill="#60a5fa" fillOpacity={0.5} />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
