'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchStudentDashboardData, type StudentDashboardData } from '@/src/lib/studentDashboardClient';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { Filter, TrendingUp, TrendingDown, Target } from 'lucide-react';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

interface RiskPoint {
  score: number;
  date: string;
  intervention?: boolean;
}

interface ChartTooltipEntry {
  value: number;
  payload: RiskPoint;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

interface DotRenderProps {
  cx?: number;
  cy?: number;
  payload?: RiskPoint;
}

function CustomChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 text-white p-3 rounded-lg shadow-xl min-w-[150px]">
        <p className="text-xs font-bold mb-1 text-gray-400">{label}</p>
        <p className="text-lg font-black flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          {payload[0].value} <span className="text-xs font-medium text-gray-400">/ 100</span>
        </p>
        {payload[0].payload.intervention && (
          <div className="mt-3 bg-red-500/20 border border-red-500/30 rounded p-2 text-[10px] font-bold text-red-200 uppercase tracking-widest text-center">
            Mentor Intervention
          </div>
        )}
      </div>
    );
  }

  return null;
}

function renderRiskDot({ cx, cy, payload }: DotRenderProps) {
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  if (payload?.intervention) {
    return (
      <circle cx={cx} cy={cy} r={7} fill="#EF4444" stroke="#fff" strokeWidth={3} className="animate-pulse" />
    );
  }
  return <circle cx={cx} cy={cy} r={5} fill="#3B82F6" stroke="#fff" strokeWidth={2} />;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('8weeks');
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      const result = await fetchStudentDashboardData();
      if (result.ok) {
        setData(result.data);
        setError('');
      } else {
        setError(result.message);
      }
      setLoading(false);
    }

    void loadAnalytics();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [] as Array<{ date: string; score: number; intervention?: boolean; isoDate: string }>;

    const now = Date.now();
    const horizonMs =
      timeRange === '4weeks'
        ? 28 * 24 * 60 * 60 * 1000
        : timeRange === '8weeks'
        ? 56 * 24 * 60 * 60 * 1000
        : Number.POSITIVE_INFINITY;

    return data.riskHistory
      .filter((point) => Number.isFinite(horizonMs) ? now - new Date(point.date).getTime() <= horizonMs : true)
      .map((point) => ({
        isoDate: point.date,
        date: new Date(point.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        score: point.score,
        intervention: point.intervention,
      }));
  }, [data, timeRange]);

  const { averageScore, bestImprovement, worstDrop } = useMemo(() => {
    if (chartData.length === 0) {
      return { averageScore: 0, bestImprovement: 0, worstDrop: 0 };
    }

    const averageScoreValue = Math.round((chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length) * 10) / 10;
    let best = 0;
    let worst = 0;

    for (let index = 1; index < chartData.length; index += 1) {
      const delta = chartData[index].score - chartData[index - 1].score;
      if (delta > best) best = delta;
      if (delta < worst) worst = delta;
    }

    return {
      averageScore: averageScoreValue,
      bestImprovement: best,
      worstDrop: worst,
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">Analytics unavailable</p>
          <p className="text-xs font-medium text-gray-500 mt-1">{error || 'Please refresh to retry.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#F8FAFC]">
      <Topbar title="Risk Analytics" subtitle="Deep dive into your risk score calculation and historical trends" />

      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs font-semibold">
            {error}
          </div>
        )}
        
        {/* Filters and Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Filter className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-bold text-gray-900">Analytics Filters</span>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {['4weeks', '8weeks', 'Semester'].map(range => (
              <button 
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  timeRange === range ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '4weeks' ? 'Last 4 Weeks' : range === '8weeks' ? 'Last 8 Weeks' : 'Entire Semester'}
              </button>
            ))}
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Average Score</p>
              <p className="text-3xl font-black text-gray-900">{averageScore}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Best Improvement</p>
              <p className="text-3xl font-black text-emerald-600">{bestImprovement > 0 ? `+${bestImprovement}` : bestImprovement} pts</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Largest positive change in selected range</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between border-b-4 border-b-orange-400">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Worst Drop</p>
              <p className="text-3xl font-black text-orange-600">{worstDrop} pts</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Largest negative change in selected range</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-base font-bold text-gray-900">Comprehensive Risk Trend</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">Interactive visualization of your academic standing</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-3 h-3 rounded-full bg-blue-500" /> Risk Score
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="w-3 h-3 rounded-full bg-red-500" /> Mentor Flag
              </div>
            </div>
          </div>
          
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }} dy={15} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }} dx={-10} />
                <Tooltip content={<CustomChartTooltip />} />
                <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="4 4" label={{ position: 'top', value: 'High-Risk Threshold (50)', fill: '#EF4444', fontSize: 11, fontWeight: 800 }} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#1D4ED8' }}
                  dot={renderRiskDot}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}
