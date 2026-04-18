'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, AlertCircle, AlertTriangle, ShieldAlert, CheckCircle2, Megaphone, Calendar, ArrowRight, UserCheck } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────

interface Summary { totalStudents: number; low: number; medium: number; high: number; critical: number; unreadAlerts: number; }
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

// ─── Dummy Data ───────────────────────────────────────────

const DUMMY: DashboardData = {
  mentor: { name: 'Dr. Rajesh Kumar', department: 'Computer Engineering' },
  summary: { totalStudents: 12, low: 3, medium: 3, high: 4, critical: 2, unreadAlerts: 5 },
  students: [
    { id: '1', name: 'Amit Joshi', studentId: '22CE005', batch: 'CE-A', riskScore: 82, riskLevel: 'critical' },
    { id: '2', name: 'Pooja Verma', studentId: '22CE010', batch: 'CE-A', riskScore: 78, riskLevel: 'critical' },
    { id: '3', name: 'Arjun Mehta', studentId: '22CE001', batch: 'CE-A', riskScore: 68, riskLevel: 'high' },
    { id: '4', name: 'Hinal Bhatt', studentId: '22CE008', batch: 'CE-A', riskScore: 62, riskLevel: 'high' },
    { id: '5', name: 'Raj Thakkar', studentId: '22CE016', batch: 'CE-B', riskScore: 58, riskLevel: 'high' },
    { id: '6', name: 'Manish Kumar', studentId: '22CE009', batch: 'CE-A', riskScore: 55, riskLevel: 'high' },
  ],
  recentAlerts: [
    { id: 'a1', studentName: 'Amit Joshi', title: 'Amit Joshi — Risk Level Elevated', message: 'Attendance at 38% and marks below average. Immediate intervention recommended.', priority: 'high', status: 'unread', sentAt: '2026-04-16T10:00:00Z' },
    { id: 'a2', studentName: 'Pooja Verma', title: 'Pooja Verma — Missing Assignments', message: 'Has not submitted 5 out of 9 assignments. Please follow up.', priority: 'medium', status: 'unread', sentAt: '2026-04-15T10:00:00Z' },
    { id: 'a3', studentName: 'Arjun Mehta', title: 'Arjun Mehta — Attendance Defaulter', message: 'Attendance dropped to 45%. Below the 75% threshold across all subjects.', priority: 'high', status: 'unread', sentAt: '2026-04-14T10:00:00Z' },
    { id: 'a4', studentName: 'Hinal Bhatt', title: 'Hinal Bhatt — Low Internal Marks', message: 'Scoring below 30% in Data Structures and Operating Systems.', priority: 'medium', status: 'acknowledged', sentAt: '2026-04-12T10:00:00Z' },
  ],
  recentActions: [
    { id: 'ac1', studentName: 'Arjun Mehta', actionType: 'counseling', description: 'One-on-one counseling session to discuss attendance and academic performance.', date: '2026-04-08T10:00:00Z', status: 'completed' },
    { id: 'ac2', studentName: 'Amit Joshi', actionType: 'extra_class', description: 'Arranged extra Data Structures tutorial to help with fundamentals.', date: '2026-04-13T10:00:00Z', status: 'scheduled' },
    { id: 'ac3', studentName: 'Pooja Verma', actionType: 'parent_meeting', description: 'Scheduled parent meeting to discuss critical academic performance.', date: '2026-04-20T10:00:00Z', status: 'scheduled' },
    { id: 'ac4', studentName: 'Hinal Bhatt', actionType: 'academic_support', description: 'Assigned peer mentor for OS and Math subjects.', date: '2026-04-04T10:00:00Z', status: 'completed' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────

const RISK_CFG: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  high:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
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

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem('shikshasetu_user');
        if (stored) {
          const user = JSON.parse(stored);
          const res = await fetch(`/api/mentor/dashboard?mentorId=${user.id}`);
          const json = await res.json();
          if (res.ok && json.data && json.data.summary?.totalStudents > 0) {
            setData(json.data); setLoading(false); return;
          }
        }
      } catch { /* fallback to dummy */ }
      setData(DUMMY); setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
    </div>
  );

  if (!data) return null;
  const { mentor, summary, students, recentAlerts, recentActions } = data;
  const highRiskStudents = students.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical');

  return (
    <div className="flex flex-col flex-1 bg-gray-50/30">
      <Topbar title="Mentor Dashboard" subtitle={`Welcome back, ${mentor.name} • ${mentor.department}`} unread={summary.unreadAlerts} />

      <main className="flex-1 p-8 space-y-8 overflow-auto max-w-7xl">
        
        {/* ── Summary Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Assigned', value: summary.totalStudents, icon: <Users className="w-5 h-5 text-blue-600" />, border: 'border-blue-200' },
            { label: 'Low Risk', value: summary.low, icon: <span className="text-emerald-500">●</span>, border: 'border-emerald-200' },
            { label: 'Medium Risk', value: summary.medium, icon: <span className="text-amber-500">●</span>, border: 'border-amber-200' },
            { label: 'High Risk', value: summary.high, icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, border: 'border-orange-200' },
            { label: 'Critical', value: summary.critical, icon: <ShieldAlert className="w-5 h-5 text-red-500" />, border: 'border-red-200' },
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
                <div className="p-8 text-center text-sm text-gray-500">All students are performing well. No critical cases.</div>
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
