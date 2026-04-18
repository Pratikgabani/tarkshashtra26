'use client';

import { getSystemAggregates, MOCK_STUDENTS } from '@/src/lib/coordinatorData';
import { Users, AlertTriangle, Activity, Briefcase } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-[72px] bg-[#FFFFFF] border-b border-[#E5E7EB] px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function CoordinatorDashboard() {
  const { total, atRisk, riskDist, deptStats } = getSystemAggregates();

  const pieData = [
    { name: 'Low Risk', value: riskDist.Low, color: '#10B981' },
    { name: 'Medium Risk', value: riskDist.Medium, color: '#F59E0B' },
    { name: 'High Risk', value: riskDist.High, color: '#F97316' },
    { name: 'Critical Risk', value: riskDist.Critical, color: '#EF4444' },
  ];

  // Dummy line chart data for trends
  const trendData = [
    { month: 'Jan', atRisk: 42, total: 150 },
    { month: 'Feb', atRisk: 38, total: 150 },
    { month: 'Mar', atRisk: 45, total: 150 },
    { month: 'Apr', atRisk: atRisk, total: 150 },
  ];

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB]">
      <Topbar title="Institution Overview" subtitle="High-level pulse on academic performance blocks" />

      <main className="flex-1 p-8 space-y-8 overflow-y-auto max-w-7xl">
        
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
                <p className="text-[11px] font-semibold text-[#6B7280] mt-1">{Math.round((atRisk/total)*100)}% of student body</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-2">Critical Cases</p>
                <p className="text-3xl font-black text-[#111827]">{riskDist.Critical}</p>
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
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
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
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
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
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
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
