'use client';

import { useState } from 'react';
import { RISK_HISTORY } from '@/src/lib/studentData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { Calendar, Filter, TrendingUp, TrendingDown, Target } from 'lucide-react';

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

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('8weeks');

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#F8FAFC]">
      <Topbar title="Risk Analytics" subtitle="Deep dive into your risk score calculation and historical trends" />

      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full space-y-6">
        
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
              <p className="text-3xl font-black text-gray-900">76.5</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Best Improvement</p>
              <p className="text-3xl font-black text-emerald-600">+4 pts</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Week 3 to Week 4</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between border-b-4 border-b-orange-400">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Worst Drop</p>
              <p className="text-3xl font-black text-orange-600">-5 pts</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Week 4 to Week 5</p>
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={RISK_HISTORY} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
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
                <ReferenceLine y={40} stroke="#EF4444" strokeDasharray="4 4" label={{ position: 'top', value: '40% Critical Threshold', fill: '#EF4444', fontSize: 11, fontWeight: 800 }} />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  activeDot={{ r: 8, strokeWidth: 0, fill: '#1D4ED8' }}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if(payload.intervention) {
                      return (
                        <circle cx={cx} cy={cy} r={7} fill="#EF4444" stroke="#fff" strokeWidth={3} className="animate-pulse" />
                      )
                    }
                    return <circle cx={cx} cy={cy} r={5} fill="#3B82F6" stroke="#fff" strokeWidth={2} />;
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}
