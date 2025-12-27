/**
 * Analytics Dashboard - GEX & Order Flow Analysis
 * Integrates GEX chart, Flow chart, and key levels
 */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import GexChart from './GexChart';
import FlowChart from './FlowChart';
import { Activity, BarChart3, Target, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

interface AnalyticsDashboardProps {
  ticker: string;
}

// API functions
const fetchGexProfile = async (ticker: string) => {
  const res = await fetch(`http://localhost:8000/api/v1/analytics/gex/${ticker}`);
  if (!res.ok) throw new Error('Failed to fetch GEX data');
  return res.json();
};

const fetchOrderFlow = async (ticker: string) => {
  const res = await fetch(`http://localhost:8000/api/v1/analytics/flow/${ticker}`);
  if (!res.ok) throw new Error('Failed to fetch flow data');
  return res.json();
};

const fetchGexLevels = async (ticker: string) => {
  const res = await fetch(`http://localhost:8000/api/v1/analytics/gex/${ticker}/levels`);
  if (!res.ok) throw new Error('Failed to fetch GEX levels');
  return res.json();
};

type TabType = 'gex' | 'flow' | 'levels';

export default function AnalyticsDashboard({ ticker }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('gex');

  // Fetch GEX profile
  const { data: gexData, isLoading: gexLoading, error: gexError } = useQuery({
    queryKey: ['gex-profile', ticker],
    queryFn: () => fetchGexProfile(ticker),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Fetch Order Flow
  const { data: flowData, isLoading: flowLoading, error: flowError } = useQuery({
    queryKey: ['order-flow', ticker],
    queryFn: () => fetchOrderFlow(ticker),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Fetch GEX Levels
  const { data: levelsData, isLoading: levelsLoading, error: levelsError } = useQuery({
    queryKey: ['gex-levels', ticker],
    queryFn: () => fetchGexLevels(ticker),
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const tabs = [
    { id: 'gex' as TabType, label: 'GEX Profile', icon: BarChart3 },
    { id: 'flow' as TabType, label: 'Order Flow', icon: Activity },
    { id: 'levels' as TabType, label: 'Key Levels', icon: Target },
  ];

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
              {ticker}
            </span>
          </div>
          
          {/* GEX Regime Badge */}
          {gexData && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              gexData.gex_regime === 'POSITIVE' 
                ? 'bg-green-900/30 border border-green-700' 
                : gexData.gex_regime === 'NEGATIVE'
                ? 'bg-red-900/30 border border-red-700'
                : 'bg-gray-800 border border-gray-700'
            }`}>
              {gexData.gex_regime === 'POSITIVE' ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : gexData.gex_regime === 'NEGATIVE' ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <Activity className="w-4 h-4 text-gray-400" />
              )}
              <span className={`text-sm font-semibold ${
                gexData.gex_regime === 'POSITIVE' 
                  ? 'text-green-400' 
                  : gexData.gex_regime === 'NEGATIVE'
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}>
                {gexData.gex_regime === 'POSITIVE' ? 'LONG GAMMA' : 
                 gexData.gex_regime === 'NEGATIVE' ? 'SHORT GAMMA' : 'NEUTRAL'}
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* GEX Profile Tab */}
        {activeTab === 'gex' && (
          <div>
            {gexLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="ml-3 text-gray-400">Loading GEX data...</span>
              </div>
            ) : gexError ? (
              <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Error loading GEX data</p>
                <p className="text-gray-500 text-sm mt-2">{(gexError as Error).message}</p>
              </div>
            ) : gexData ? (
              <GexChart data={gexData} height={450} />
            ) : null}
          </div>
        )}

        {/* Order Flow Tab */}
        {activeTab === 'flow' && (
          <div>
            {flowLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <span className="ml-3 text-gray-400">Loading flow data...</span>
              </div>
            ) : flowError ? (
              <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Error loading flow data</p>
                <p className="text-gray-500 text-sm mt-2">{(flowError as Error).message}</p>
              </div>
            ) : flowData ? (
              <FlowChart 
                data={flowData.data} 
                divergence={flowData.divergence}
                ticker={ticker}
                height={450} 
              />
            ) : null}
          </div>
        )}

        {/* Key Levels Tab */}
        {activeTab === 'levels' && (
          <div>
            {levelsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
                <span className="ml-3 text-gray-400">Loading levels...</span>
              </div>
            ) : levelsError ? (
              <div className="text-center py-20">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">Error loading levels</p>
                <p className="text-gray-500 text-sm mt-2">{(levelsError as Error).message}</p>
              </div>
            ) : levelsData ? (
              <KeyLevelsPanel data={levelsData} gexData={gexData} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

// Key Levels Panel Component
interface KeyLevelsPanelProps {
  data: {
    ticker: string;
    spot_price: number;
    levels: {
      flip_point: number | null;
      max_pain: number | null;
      resistance: number | null;
      support: number | null;
    };
    interpretation: {
      above_flip: string;
      below_flip: string;
    };
  };
  gexData?: {
    spot_price: number;
    flip_point: number | null;
    net_gex: number;
    total_vex: number;
    total_cex: number;
    gex_regime: string;
    local_gex: number;
  };
}

function KeyLevelsPanel({ data, gexData }: KeyLevelsPanelProps) {
  const spotPrice = data.spot_price;
  const flipPoint = data.levels.flip_point;
  const isAboveFlip = flipPoint ? spotPrice > flipPoint : null;

  return (
    <div className="space-y-6">
      {/* Current Position */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Spot Price */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Spot Price</span>
          </div>
          <p className="text-2xl font-bold text-white">${spotPrice.toLocaleString()}</p>
        </div>

        {/* Gamma Flip */}
        <div className={`rounded-lg p-4 border ${
          isAboveFlip 
            ? 'bg-green-900/20 border-green-700' 
            : 'bg-red-900/20 border-red-700'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-yellow-400" />
            <span className="text-gray-400 text-sm">Gamma Flip Point</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {flipPoint ? `$${flipPoint.toLocaleString()}` : 'N/A'}
          </p>
          {isAboveFlip !== null && (
            <p className={`text-xs mt-1 ${isAboveFlip ? 'text-green-400' : 'text-red-400'}`}>
              {isAboveFlip ? '↑ Above flip (stabilizing)' : '↓ Below flip (accelerating)'}
            </p>
          )}
        </div>

        {/* Max Pain */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <span className="text-gray-400 text-sm">Max Pain</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {data.levels.max_pain ? `$${data.levels.max_pain.toLocaleString()}` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Enhanced Metrics from GEX */}
      {gexData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard 
            label="Net GEX" 
            value={gexData.net_gex.toFixed(4)} 
            unit="M"
            positive={gexData.net_gex > 0}
          />
          <MetricCard 
            label="Local GEX (±5%)" 
            value={gexData.local_gex.toFixed(4)} 
            unit="M"
            positive={gexData.local_gex > 0}
          />
          <MetricCard 
            label="Total VEX" 
            value={gexData.total_vex.toFixed(4)} 
            unit="M"
            neutral
          />
          <MetricCard 
            label="Total CEX" 
            value={gexData.total_cex.toFixed(4)} 
            unit="M"
            neutral
          />
        </div>
      )}

      {/* Interpretation */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Market Interpretation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-green-900/20 rounded-lg border border-green-800">
            <p className="text-green-400 font-medium mb-1">Above Flip Point:</p>
            <p className="text-gray-300">{data.interpretation.above_flip}</p>
          </div>
          <div className="p-3 bg-red-900/20 rounded-lg border border-red-800">
            <p className="text-red-400 font-medium mb-1">Below Flip Point:</p>
            <p className="text-gray-300">{data.interpretation.below_flip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  label, 
  value, 
  unit, 
  positive, 
  neutral 
}: { 
  label: string; 
  value: string; 
  unit: string; 
  positive?: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono ${
        neutral 
          ? 'text-gray-300' 
          : positive 
          ? 'text-green-400' 
          : 'text-red-400'
      }`}>
        {value}{unit}
      </p>
    </div>
  );
}
