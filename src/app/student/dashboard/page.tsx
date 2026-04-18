'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  RISK_SCORE_DATA, 
  OVERALL_STATS, 
  SUBJECT_PERFORMANCE, 
  PENDING_ASSIGNMENTS,
  ALERTS,
  RISK_HISTORY,
  type RiskLevel 
} from '@/src/lib/studentData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { ChevronRight, TrendingUp, TrendingDown, BookOpen, Clock, AlertTriangle, Calendar, FileText } from 'lucide-react';

// ─── Reusable Topbar ────────────────────────────────────────────────────────
function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors bg-gray-50 border border-gray-200">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1 max-right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
        </button>
      </div>
    </div>
  );
}
import { Bell } from 'lucide-react';

// ─── Risk Badge ─────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = {
    Low:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium:   'bg-amber-50 text-amber-700 border-amber-200',
    High:     'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  };
  const dots = {
    Low: 'bg-emerald-500', Medium: 'bg-amber-500', High: 'bg-orange-500', Critical: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${cfg[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[level]}`} />
      {level} Risk
    </span>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // SVG Donut metrics
  const score = RISK_SCORE_DATA.score;
  const strokeDasharray = `${(score / 100) * 283} 283`;
  const strokeColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';

  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-800 text-white p-3 rounded-lg shadow-xl">
          <p className="text-xs font-bold mb-1">{label}</p>
          <p className="text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
            Score: {payload[0].value}
          </p>
          {payload[0].payload.intervention && (
            <p className="text-[10px] text-blue-300 mt-2 bg-blue-900/30 px-2 py-1 rounded border border-blue-800">
              Mentor Intervention
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Overview" subtitle={`Review your analytical risk profile and performance.`} />

      <main className="flex-1 p-8 space-y-8 overflow-auto max-w-7xl">
        
        {/* ── Top Section: Risk Score & Quick Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Risk Score Hero Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Current Risk Profile</h2>
            
            <div className="relative w-40 h-40 mb-6 transition-transform duration-500 group-hover:scale-105">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={strokeColor}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">{score}</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Score</span>
              </div>
            </div>

            <RiskBadge level={RISK_SCORE_DATA.level} />

            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-600">
              {RISK_SCORE_DATA.message}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
              {RISK_SCORE_DATA.trend === 'worsening' ? <TrendingDown className="w-4 h-4 text-orange-500" /> : <TrendingUp className="w-4 h-4 text-green-500" />}
              <span suppressHydrationWarning>Updated {new Date(RISK_SCORE_DATA.calculatedAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Right Column: Factors & Stats */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Attendance', value: `${OVERALL_STATS.attendance}%`, warn: OVERALL_STATS.attendance < 75 },
                { label: 'Assignments', value: `${OVERALL_STATS.assignmentCompletionRate}%`, warn: OVERALL_STATS.assignmentCompletionRate < 85 },
                { label: 'Late Subs', value: OVERALL_STATS.lateSubmissions, warn: OVERALL_STATS.lateSubmissions > 1 },
                { label: 'Pending', value: OVERALL_STATS.pendingAssignments, warn: OVERALL_STATS.pendingAssignments > 0 },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-2xl font-black ${s.warn ? 'text-orange-600' : 'text-gray-900'}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Top 3 Risk Factors Explanation Engine */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Top Risk Factors</h3>
                  <p className="text-xs font-medium text-gray-500 mt-1">Factors heavily impacting your score right now</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
              </div>

              <div className="space-y-5">
                {RISK_SCORE_DATA.factors.map((f, i) => {
                  const isBad = f.factor === 'Assignments' ? f.currentValue > f.threshold : f.currentValue < f.threshold;
                  const pct = f.factor === 'Assignments' 
                    ? Math.min(100, (f.threshold / Math.max(f.currentValue, 1)) * 100)
                    : Math.min(100, (f.currentValue / f.threshold) * 100);

                  return (
                    <div key={f.factor} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex gap-3 items-center">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${isBad ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-gray-800">{f.label}</p>
                            <p className="text-xs font-medium text-gray-500 mt-0.5">{f.suggestion}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-black ${isBad ? 'text-orange-600' : 'text-emerald-600'}`}>
                            {f.currentValue}{f.unit}
                          </span>
                          <span className="text-xs font-bold text-gray-400 ml-1">/ {f.threshold}{f.unit} target</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${isBad ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${pct}%` }} 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ── Subjects & Line Chart Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Subject Performance Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Subject Performance</h3>
              <Link href="/student/subjects" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View Detailed <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {SUBJECT_PERFORMANCE.map(s => (
                <Link 
                  href={`/student/subjects?id=${s.id}`} 
                  key={s.id}
                  className="block bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                  onMouseEnter={() => setHoveredSubject(s.id)}
                  onMouseLeave={() => setHoveredSubject(null)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{s.name}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{s.faculty}</p>
                    </div>
                    <RiskBadge level={s.riskLevel as RiskLevel} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FileText className="w-3 h-3"/> Internal Marks</p>
                      <p className="text-lg font-black text-gray-800">{s.marks.obtained}<span className="text-xs font-bold text-gray-400">/{s.marks.max}</span></p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><BookOpen className="w-3 h-3"/> Assignments</p>
                      <p className="text-lg font-black text-gray-800">{s.assignments.completed}<span className="text-xs font-bold text-gray-400">/{s.assignments.total}</span></p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Risk Trend</h3>
                <p className="text-xs font-medium text-gray-500 mt-1">Score history over the last 8 weeks</p>
              </div>
              <Link href="/student/analytics" className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                <LineChart className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={RISK_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }} dy={10} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <ReferenceLine y={40} stroke="#EF4444" strokeDasharray="4 4" label={{ position: 'top', value: 'Threshold', fill: '#EF4444', fontSize: 10, fontWeight: 700 }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3B82F6" 
                    strokeWidth={4}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      if(payload.intervention) {
                        return (
                          <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />
                        )
                      }
                      return <circle cx={cx} cy={cy} r={4} fill="#3B82F6" stroke="#fff" strokeWidth={2} />;
                    }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#2563EB' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Score</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Mentor Intervention</span>
            </div>
          </div>
        </div>

        {/* ── Alerts & Suggestions Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Actionable Suggestions / Pending */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 border-t-4 border-t-orange-400">
            <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Action Required
            </h3>
            
            <div className="space-y-3">
              {PENDING_ASSIGNMENTS.map(pa => {
                const daysLeft = Math.ceil((new Date(pa.dueDate).getTime() - new Date('2026-04-18').getTime()) / 86400000);
                return (
                  <div key={pa.id} className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-white border border-orange-200 flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Due in</span>
                      <span className="text-lg font-black text-orange-600 leading-none">{daysLeft}d</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{pa.title}</h4>
                      <p className="text-xs font-semibold text-gray-500 mt-1">{pa.subject} • Max {pa.maxMarks} marks</p>
                    </div>
                    <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                      Submit
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notifications Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-400" /> Recent Alerts
              </h3>
              <Link href="/student/alerts" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {ALERTS.slice(0, 3).map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border flex gap-3 ${alert.isRead ? 'bg-gray-50 border-gray-100' : 'bg-blue-50/30 border-blue-100'}`}>
                  <div className="mt-1">
                    {alert.priority === 'Critical' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Calendar className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                      <span className="text-[10px] font-bold text-gray-400">{alert.dateTime}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-600 leading-relaxed">{alert.message}</p>
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
