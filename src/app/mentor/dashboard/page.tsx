'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────

interface Summary {
  totalStudents: number; low: number; medium: number; high: number; critical: number; unreadAlerts: number;
}
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

const RISK_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  low:      { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  medium:   { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  high:     { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
};

function riskBadge(level: string) {
  const c = RISK_CFG[level] || RISK_CFG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function actionLabel(t: string) {
  return { counseling: 'Counseling', extra_class: 'Extra Class', academic_support: 'Academic Support', parent_meeting: 'Parent Meeting', peer_mentoring: 'Peer Mentoring', other: 'Other' }[t] || t;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
          // Try real API first
          const res = await fetch(`/api/mentor/dashboard?mentorId=${user.id}`);
          const json = await res.json();
          if (res.ok && json.data && json.data.summary?.totalStudents > 0) {
            setData(json.data);
            setLoading(false);
            return;
          }
        }
      } catch { /* fallback to dummy */ }
      // Fallback: use dummy data
      setData(DUMMY);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#2563EB]" />
    </div>
  );

  if (!data) return null;

  const { mentor, summary, students, recentAlerts, recentActions } = data;
  const highRiskStudents = students.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical');

  return (
    <div className="flex flex-col flex-1">
      {/* Topbar */}
      <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-[#111827]">Mentor Dashboard</h1>
          <p className="text-xs text-[#6B7280]">Welcome back, {mentor.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/mentor/alerts" className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors">
            <svg className="h-[18px] w-[18px] text-[#6B7280]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {summary.unreadAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{summary.unreadAlerts}</span>
            )}
          </Link>
          <div className="text-xs text-right">
            <p className="font-medium text-[#111827]">{mentor.name}</p>
            <p className="text-[#6B7280]">{mentor.department}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-6">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Total Students', value: summary.totalStudents, icon: '👥', accent: 'bg-blue-50 text-blue-600' },
            { label: 'Low Risk', value: summary.low, icon: '🟢', accent: 'bg-green-50 text-green-600' },
            { label: 'Medium Risk', value: summary.medium, icon: '🟡', accent: 'bg-yellow-50 text-yellow-600' },
            { label: 'High Risk', value: summary.high, icon: '🟠', accent: 'bg-orange-50 text-orange-600' },
            { label: 'Critical', value: summary.critical, icon: '🔴', accent: 'bg-red-50 text-red-600' },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-[#E5E7EB] rounded-lg p-4">
              <div className={`w-8 h-8 rounded-lg ${c.accent} flex items-center justify-center mb-3 text-sm`}>
                {c.icon}
              </div>
              <p className="text-2xl font-bold text-[#111827]">{c.value}</p>
              <p className="text-xs font-medium text-[#6B7280] mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-5">

          {/* ── High-Risk Students ── */}
          <div className="col-span-2 bg-white border border-[#E5E7EB] rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#111827]">Students Requiring Attention</h2>
                <p className="text-xs text-[#6B7280]">{highRiskStudents.length} students at high/critical risk</p>
              </div>
              <Link href="/mentor/students" className="text-xs font-medium text-[#2563EB] hover:underline">View All →</Link>
            </div>
            <div className="overflow-auto max-h-[280px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Student</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Batch</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Risk Score</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Level</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskStudents.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-semibold text-[#111827]">{s.name}</p>
                        <p className="text-[10px] text-[#6B7280]">{s.studentId}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#6B7280]">{s.batch}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-bold ${s.riskScore >= 75 ? 'text-red-600' : 'text-orange-600'}`}>{s.riskScore}</span>
                      </td>
                      <td className="px-3 py-2.5">{riskBadge(s.riskLevel)}</td>
                      <td className="px-3 py-2.5">
                        <Link href={`/mentor/students?view=${s.id}`} className="text-xs font-medium text-[#2563EB] hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Recent Alerts ── */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111827]">Recent Alerts</h2>
              <Link href="/mentor/alerts" className="text-xs font-medium text-[#2563EB] hover:underline">All →</Link>
            </div>
            <div className="flex-1 overflow-auto max-h-[280px] p-4 space-y-2.5">
              {recentAlerts.slice(0, 5).map((a) => (
                <div key={a.id} className={`rounded-lg border p-3 ${a.status === 'unread' ? 'bg-blue-50/50 border-blue-200' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-[#111827] leading-snug">{a.title}</p>
                    {a.status === 'unread' && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />}
                  </div>
                  <p className="mt-1 text-[11px] text-[#6B7280] line-clamp-2">{a.message}</p>
                  <p className="mt-1 text-[10px] text-[#6B7280]">{formatDate(a.sentAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Actions ── */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111827]">Recent Interventions</h2>
            <Link href="/mentor/actions" className="text-xs font-medium text-[#2563EB] hover:underline">Manage →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActions.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${a.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                    {a.actionType === 'counseling' ? '💬' : a.actionType === 'extra_class' ? '📚' : a.actionType === 'parent_meeting' ? '👨‍👩‍👦' : '🎯'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#111827]">{actionLabel(a.actionType)} — {a.studentName}</p>
                    <p className="text-[11px] text-[#6B7280] line-clamp-1">{a.description}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold border ${a.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{a.status}</span>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">{formatDate(a.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
