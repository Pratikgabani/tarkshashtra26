'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, AlertCircle, AlertTriangle, CheckCircle2, Megaphone, Calendar, ArrowRight, UserCheck } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

interface Summary { totalStudents: number; low: number; medium: number; high: number; unreadAlerts: number; }
interface StudentRow { id: string; name: string; studentId: string; batch: string; riskScore: number; riskLevel: string; }
interface AlertItem { id: string; studentName: string; title: string; message: string; priority: string; status: string; sentAt: string; }
interface ActionItem { id: string; studentName: string; actionType: string; description: string; date: string; status: string; }

interface DashboardData {
  mentor: { name: string; department: string };
  summary: Summary;
  students: StudentRow[];
  recentAlerts: AlertItem[];
  recentActions: ActionItem[];
}

// ─── Helpers ──────────────────────────────────────────────

const RISK_CFG: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  high:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

function riskBadge(level: string) {
  const c = RISK_CFG[level] || RISK_CFG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
}

function actionLabel(t: string) {
  return { counseling: 'Counseling', extra_class: 'Extra Class', academic_support: 'Academic Support', parent_meeting: 'Parent Meeting', peer_mentoring: 'Peer Mentoring', other: 'Other' }[t] || t;
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

// ─── Reusable Topbar ────────────────────────────────────────────────────────
function Topbar({ title, subtitle, unread }: { title: string; subtitle?: string; unread: number }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Link href="/mentor/alerts" className="relative p-2 rounded-full hover:bg-gray-100 transition-colors bg-gray-50 border border-gray-200">
          <Megaphone className="w-4 h-4 text-gray-500" />
          {unread > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />}
        </Link>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────

export default function MentorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/mentor/dashboard', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json?.success && json?.data) {
          setData(json.data);
          setError('');
          return;
        }
        setError(json?.message || 'Unable to load mentor dashboard data.');
      } catch {
        setError('Unable to load mentor dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
    </div>
  );

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">Mentor dashboard unavailable</p>
          <p className="text-xs font-medium text-gray-500 mt-1">{error || 'Please refresh to retry.'}</p>
        </div>
      </div>
    );
  }
  const { mentor, summary, students, recentAlerts, recentActions } = data;
  const highRiskStudents = students.filter(s => s.riskLevel === 'high');

  return (
    <div className="flex flex-col flex-1 bg-gray-50/30">
      <Topbar title="Mentor Dashboard" subtitle={`Welcome back, ${mentor.name} • ${mentor.department}`} unread={summary.unreadAlerts} />

      <main className="flex-1 p-8 space-y-8 overflow-auto max-w-7xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs font-semibold">
            {error}
          </div>
        )}
        
        {/* ── Summary Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Assigned', value: summary.totalStudents, icon: <Users className="w-5 h-5 text-blue-600" />, border: 'border-blue-200' },
            { label: 'Low Risk', value: summary.low, icon: <span className="text-emerald-500">●</span>, border: 'border-emerald-200' },
            { label: 'Medium Risk', value: summary.medium, icon: <span className="text-amber-500">●</span>, border: 'border-amber-200' },
            { label: 'High Risk', value: summary.high, icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, border: 'border-orange-200' },
            { label: 'Unread Alerts', value: summary.unreadAlerts, icon: <Megaphone className="w-5 h-5 text-blue-500" />, border: 'border-blue-200' },
          ].map((c) => (
            <div key={c.label} className={`bg-white rounded-xl border p-5 shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1 ${c.border}`}>
              <div className="flex justify-between items-start mb-2 mt-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{c.label}</p>
                {c.icon}
              </div>
              <p className="text-3xl font-black text-gray-900 leading-none">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── High-Risk Students List ── */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" /> Focus Required
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">{highRiskStudents.length} students at elevated risk levels</p>
              </div>
              <Link href="/mentor/students" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="overflow-auto flex-1">
              {highRiskStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">All students are performing well. No high-risk cases.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Batch</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Risk Score</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highRiskStudents.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{s.name}</p>
                          <p className="text-[11px] font-medium text-gray-500 mt-0.5">{s.studentId}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-600">{s.batch}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${s.riskScore >= 75 ? 'text-red-600' : 'text-orange-600'}`}>{s.riskScore}</span>
                        </td>
                        <td className="px-6 py-4">{riskBadge(s.riskLevel)}</td>
                        <td className="px-6 py-4">
                          <Link href={`/mentor/students?view=${s.id}`} className="px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors">
                            Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Interventions & Alerts Side Column ── */}
          <div className="flex flex-col gap-6">
            
            {/* Recent Alerts Spotlight */}
            <div className="bg-white border text-left border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-1/2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-500" /> Latest Alerts
                </h2>
                <Link href="/mentor/alerts" className="text-xs font-bold text-blue-600 hover:text-blue-700">All</Link>
              </div>
              <div className="flex-1 overflow-auto space-y-3">
                {recentAlerts.length === 0 ? (
                   <p className="text-xs text-gray-500">No new alerts.</p>
                ) : recentAlerts.slice(0, 3).map((a) => (
                  <div key={a.id} className={`p-4 rounded-xl border ${a.status === 'unread' ? 'bg-blue-50/40 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-bold text-gray-900 leading-snug truncate">{a.title}</p>
                      {a.status === 'unread' && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600 mt-1" />}
                    </div>
                    <p className="text-[11px] font-medium text-gray-600 line-clamp-2 leading-relaxed">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Actions Mini */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-1/2">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" /> Recent Actions
                </h2>
                <Link href="/mentor/actions" className="text-xs font-bold text-blue-600 hover:text-blue-700">Manage</Link>
              </div>
              <div className="flex-1 overflow-auto space-y-3">
                {recentActions.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex gap-3 items-center group">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.status === 'completed' ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                      {a.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Calendar className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{actionLabel(a.actionType)}</p>
                      <p className="text-[10px] font-medium text-gray-500 truncate">{a.studentName} • {formatDate(a.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
