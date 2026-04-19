'use client';

import { useEffect, useState } from 'react';
import { Users, AlertTriangle, Activity, Briefcase } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
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

interface DashboardPayload {
  total: number;
  atRisk: number;
  riskDist: {
    Low: number;
    Medium: number;
    High: number;
  };
  deptStats: Array<{
    department: string;
    total: number;
    atRisk: number;
    riskRate: number;
  }>;
  trend: Array<{
    month: string;
    atRisk: number;
    total: number;
  }>;
}

export default function CoordinatorDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch('/api/coordinator/dashboard', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          setData({
            total: Number(json.data.total) || 0,
            atRisk: Number(json.data.atRisk) || 0,
            riskDist: {
              Low: Number(json.data.riskDist?.Low) || 0,
              Medium: Number(json.data.riskDist?.Medium) || 0,
              High: Number(json.data.riskDist?.High) || 0,
            },
            deptStats: Array.isArray(json.data.deptStats) ? json.data.deptStats : [],
            trend: Array.isArray(json.data.trend) ? json.data.trend : [],
          });
          setError('');
        } else if (!cancelled) {
          setError(json?.message || 'Unable to load coordinator dashboard.');
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load coordinator dashboard.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col flex-1 bg-[#F9FAFB]">
        <Topbar title="Institution Overview" subtitle="High-level pulse on academic performance blocks" />
        <main className="flex-1 p-8">
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C]">
            {error || 'Coordinator dashboard unavailable.'}
          </div>
        </main>
      </div>
    );
  }

  const { total, atRisk, riskDist, deptStats, trend } = data;

  const pieData = [
    { name: 'Low Risk', value: riskDist.Low, color: '#10B981' },
    { name: 'Medium Risk', value: riskDist.Medium, color: '#F59E0B' },
    { name: 'High Risk', value: riskDist.High, color: '#F97316' },
  ];

  const trendData = trend;

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB]">
      <Topbar title="Institution Overview" subtitle="High-level pulse on academic performance blocks" />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl">
        {loading && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs font-semibold text-[#1D4ED8]">
            Loading live coordinator data...
          </div>
        )}
        {error && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C]">
            {error}
          </div>
        )}
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Total Students</p>
                <p className="text-3xl font-black text-[#111827]">{total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#2563EB]" />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 shadow-sm border-b-4 border-b-[#EF4444]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">At-Risk Students</p>
                <p className="text-3xl font-black text-[#EF4444]">{atRisk}</p>
                <p className="text-[11px] font-semibold text-[#6B7280] mt-1">
                  {total > 0 ? Math.round((atRisk / total) * 100) : 0}% of student body
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">High-Risk Cases</p>
                <p className="text-3xl font-black text-[#111827]">{riskDist.High}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#6B7280]" />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Departments</p>
                <p className="text-3xl font-black text-[#111827]">{deptStats.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#6B7280]" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Risk Distribution Pie */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-6 lg:col-span-1">
            <h3 className="text-[15px] font-bold text-[#111827] mb-1">Risk Distribution</h3>
            <p className="text-xs text-[#6B7280] font-medium mb-6">Breakdown of student body health</p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500, paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Comparison Bar */}
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-6 lg:col-span-2">
            <h3 className="text-[15px] font-bold text-[#111827] mb-1">Department Comparison</h3>
            <p className="text-xs text-[#6B7280] font-medium mb-6">At-risk vs Total students by department</p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={deptStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#6B7280' }} />
                  <RechartsTooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="total" name="Total Enrolled" fill="#E5E7EB" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="atRisk" name="At Risk" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Institution Trend */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-bold text-[#111827]">At-Risk Trend (Institution Wide)</h3>
              <p className="text-xs text-[#6B7280] font-medium mt-1">Number of students flagged vs total body</p>
            </div>
            <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-xs font-bold text-[#111827] bg-white hover:bg-[#F9FAFB]">
              Export Chart
            </button>
          </div>
          <div className="h-75">
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
                  <Line type="monotone" dataKey="total" name="Total Students" stroke="#E5E7EB" strokeWidth={3} dot={false} activeDot={false} />
                  <Line type="monotone" dataKey="atRisk" name="At-Risk Cases" stroke="#EF4444" strokeWidth={4} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}

