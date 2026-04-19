'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, TrendingDown, Target, Building2, BookOpen } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="app-topbar">
      <div>
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface AnalyticsPayload {
  total: number;
  atRisk: number;
  riskPercentage: number;
  deptStats: Array<{
    department: string;
    total: number;
    atRisk: number;
    riskRate: number;
  }>;
  classStats: Array<{
    class: string;
    avgScore: number;
    atRiskCount: number;
  }>;
  insights: Array<{
    type: string;
    text: string;
    action: string;
  }>;
}

function getInsightIcon(type: string) {
  if (type === 'Department') return Building2;
  if (type === 'Class') return BookOpen;
  if (type === 'Trend') return TrendingDown;
  return Lightbulb;
}

export default function CoordinatorAnalytics() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const response = await fetch('/api/coordinator/analytics', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          setData({
            total: Number(json.data.total) || 0,
            atRisk: Number(json.data.atRisk) || 0,
            riskPercentage: Number(json.data.riskPercentage) || 0,
            deptStats: Array.isArray(json.data.deptStats) ? json.data.deptStats : [],
            classStats: Array.isArray(json.data.classStats) ? json.data.classStats : [],
            insights: Array.isArray(json.data.insights) ? json.data.insights : [],
          });
          setError('');
        } else if (!cancelled) {
          setError(json?.message || 'Unable to load analytics data.');
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load analytics data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col flex-1 bg-[#F9FAFB]">
        <Topbar title="Aggregate Analytics & Patterns" subtitle="Automated insights and deep drill-downs into risk vectors" />
        <main className="flex-1 p-8">
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C]">
            {error || 'Analytics data unavailable.'}
          </div>
        </main>
      </div>
    );
  }

  const { riskPercentage, deptStats, classStats, insights } = data;

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB]">
      <Topbar title="Aggregate Analytics & Patterns" subtitle="Automated insights and deep drill-downs into risk vectors" />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl">
        {loading && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs font-semibold text-[#1D4ED8]">
            Loading analytics from backend...
          </div>
        )}
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C]">
            {error}
          </div>
        )}
        
        {/* Core Percentage Card */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-8 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-2">Institution Health Score</h2>
            <div className="flex items-end gap-3">
              <span className={`text-5xl font-black ${riskPercentage > 20 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>{riskPercentage}%</span>
              <span className="text-[15px] font-bold text-[#111827] mb-1">of total student body is At-Risk</span>
            </div>
          </div>
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
            <Target className="w-10 h-10 text-[#2563EB]" />
          </div>
        </div>

        {/* Pattern Engine Insights */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#111827]">Pattern Detection Engine</h3>
              <p className="text-xs text-[#6B7280] font-medium">Automated observations based on recent data</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((ins, i) => {
              const Icon = getInsightIcon(ins.type);
              return (
                <div key={i} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-5 hover:border-blue-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest">{ins.type} Alert</span>
                  </div>
                  <p className="text-sm font-semibold text-[#111827] leading-relaxed mb-4">{ins.text}</p>
                  <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] border-l-4 border-l-[#2563EB]">
                    <p className="text-xs text-[#6B7280] font-semibold"><span className="text-[#111827]">Suggested Action:</span> {ins.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown Tables/Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-6">
            <h3 className="text-[15px] font-bold text-[#111827] mb-1">Class-wise Analysis</h3>
            <p className="text-xs text-[#6B7280] font-medium mb-6">At-Risk students by class block</p>
            <div className="h-62.5">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={classStats} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis type="category" dataKey="class" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#111827' }} />
                  <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none' }} />
                  <Bar dataKey="atRiskCount" name="At-Risk Cases" fill="#F97316" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-6">
            <h3 className="text-[15px] font-bold text-[#111827] mb-1">Department Risk Rates</h3>
            <p className="text-xs text-[#6B7280] font-medium mb-6">Percentage of at-risk students by department</p>
            <div className="space-y-4">
              {[...deptStats].sort((a, b) => b.riskRate - a.riskRate).map(d => (
                <div key={d.department}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[13px] font-bold text-[#111827]">{d.department}</span>
                    <span className={`text-[13px] font-bold ${d.riskRate > 25 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>{d.riskRate}%</span>
                  </div>
                  <div className="w-full bg-[#F9FAFB] rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full ${d.riskRate > 25 ? 'bg-[#EF4444]' : d.riskRate > 15 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`}
                      style={{ width: `${d.riskRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

