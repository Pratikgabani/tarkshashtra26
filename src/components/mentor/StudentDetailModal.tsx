'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────

interface Factor { factor: string; label: string; currentValue: number; threshold: number; unit: string; contribution: number; suggestion: string; }
interface RiskData { score: number; riskLevel: string; factors: Factor[]; calculatedAt: string; }
interface RiskHistoryPoint { score: number; riskLevel: string; date: string; }
interface AttSubject { subjectName: string; total: number; present: number; percentage: number; }
interface AssessmentItem { subject: string; type: string; marksObtained: number; maxMarks: number; }
interface AssignmentItem { title: string; status: string; marksObtained: number | null; maxMarks: number; dueDate: string; }
interface RemarkItem { id: string; text: string; followUpDate: string | null; createdAt: string; }
interface ActionItem { id: string; actionType: string; description: string; date: string; status: string; outcome: string; remarks: RemarkItem[]; }
interface OverallStats { attendance: number; marks: number; assignmentsCompleted: number; totalAssignments: number; }
interface StudentProfile { id: string; name: string; email: string; studentId: string; batch: string; semester: number; department: string; }

interface StudentDetail {
  student: StudentProfile;
  risk: RiskData | null;
  riskHistory: RiskHistoryPoint[];
  overallStats: OverallStats;
  attendance: AttSubject[];
  assessments: AssessmentItem[];
  assignments: AssignmentItem[];
  actions: ActionItem[];
}

// ─── Helpers ──────────────────────────────────────────────

const RISK_CFG: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  medium: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  high: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
};

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function actionLabel(t: string) { return { counseling: 'Counseling', extra_class: 'Extra Class', academic_support: 'Academic Support', parent_meeting: 'Parent Meeting', peer_mentoring: 'Peer Mentoring', other: 'Other' }[t] || t; }
function assessmentLabel(t: string) { return { unit_test_1: 'UT 1', unit_test_2: 'UT 2', midterm: 'Mid-Term', endterm: 'End-Term' }[t] || t; }

function getUser() {
  const s = localStorage.getItem('shikshasetu_user');
  return s ? JSON.parse(s) : null;
}

// ─── Component ────────────────────────────────────────────

export default function StudentDetailModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);
  const [tab, setTab] = useState<'overview' | 'attendance' | 'marks' | 'assignments' | 'actions'>('overview');

  // Action form
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionForm, setActionForm] = useState({ actionType: 'counseling', description: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  // Remark form
  const [remarkActionId, setRemarkActionId] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [remarkFollowUp, setRemarkFollowUp] = useState('');

  const refreshDetail = () => {
    setLoading(true);
    setReloadToken((token) => token + 1);
  };

  useEffect(() => {
    const user = getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    let isActive = true;

    (async () => {
      try {
        const res = await fetch(`/api/mentor/students/${studentId}?mentorId=${user.id}`);
        const json = await res.json();
        if (res.ok && isActive) setData(json.data);
      } catch {
        /* ignore */
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [studentId, reloadToken]);

  async function handleCreateAction() {
    const user = getUser();
    if (!user || !actionForm.description.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/mentor/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: user.id, studentId, ...actionForm }),
      });
      setShowActionForm(false);
      setActionForm({ actionType: 'counseling', description: '', date: new Date().toISOString().split('T')[0] });
      refreshDetail();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleAddRemark() {
    const user = getUser();
    if (!user || !remarkText.trim() || !remarkActionId) return;
    try {
      await fetch('/api/mentor/remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: remarkActionId, mentorId: user.id, studentId, text: remarkText, followUpDate: remarkFollowUp || undefined }),
      });
      setRemarkActionId(null);
      setRemarkText('');
      setRemarkFollowUp('');
      refreshDetail();
    } catch { /* ignore */ }
  }

  async function handleUpdateActionStatus(actionId: string, status: string) {
    const user = getUser();
    if (!user) {
      window.location.assign('/login');
      return;
    }
    try {
      await fetch('/api/mentor/actions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId, mentorId: user.id, status }),
      });
      refreshDetail();
    } catch { /* ignore */ }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#2563EB]" /></div>
    </div>
  );

  if (!data) return null;

  const { student, risk, riskHistory, overallStats, attendance, assessments, assignments, actions } = data;
  const rc = risk ? (RISK_CFG[risk.riskLevel] || RISK_CFG.medium) : RISK_CFG.low;

  // Chart data
  const chartData = riskHistory.map((r, i) => ({ week: `W${riskHistory.length - i}`, score: r.score, date: formatDate(r.date) }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-8 pb-8 overflow-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col max-h-[calc(100vh-64px)]">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[#111827]">{student.name}</h2>
            <p className="text-xs text-[#6B7280]">{student.studentId} · {student.batch} · Sem {student.semester} · {student.department}</p>
          </div>
          <div className="flex items-center gap-3">
            {risk && <span className={`rounded border px-3 py-1 text-xs font-bold ${rc.bg} ${rc.text}`}>Risk: {risk.score} — {risk.riskLevel.toUpperCase()}</span>}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-[#6B7280]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-1 shrink-0">
          {(['overview', 'attendance', 'marks', 'assignments', 'actions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${tab === t ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-[#6B7280] hover:text-[#111827]'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-5">

          {/* ── TAB: Overview ── */}
          {tab === 'overview' && (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Attendance', value: `${overallStats.attendance}%`, warn: overallStats.attendance < 75 },
                  { label: 'Marks', value: `${overallStats.marks}%`, warn: overallStats.marks < 40 },
                  { label: 'Assignments', value: `${overallStats.assignmentsCompleted}/${overallStats.totalAssignments}`, warn: overallStats.assignmentsCompleted < overallStats.totalAssignments * 0.7 },
                  { label: 'Risk Score', value: String(risk?.score ?? 0), warn: (risk?.score ?? 0) >= 50 },
                ].map(s => (
                  <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-lg p-3">
                    <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">{s.label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${s.warn ? 'text-red-600' : 'text-[#111827]'}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Risk factors */}
              {risk && risk.factors.length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                  <h3 className="text-xs font-semibold text-[#111827] mb-3">Risk Factor Analysis</h3>
                  <div className="space-y-3">
                    {risk.factors.map(f => {
                      const isBad = f.factor === 'submission_timeliness' ? f.currentValue > f.threshold : f.currentValue < f.threshold;
                      const pct = Math.min(100, (f.currentValue / Math.max(f.threshold, 1)) * 100);
                      return (
                        <div key={f.factor}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-[#111827]">{f.label}</span>
                            <span className={isBad ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{f.currentValue}{f.unit === '%' ? '%' : ` ${f.unit}`}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isBad ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[10px] text-[#6B7280] mt-0.5">{f.suggestion}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Risk history chart */}
              {chartData.length >= 2 && (
                <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                  <h3 className="text-xs font-semibold text-[#111827] mb-3">Risk Score Trend</h3>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={{ stroke: '#E5E7EB' }} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                        <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="6 4" strokeOpacity={0.4} />
                        <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="6 4" strokeOpacity={0.4} />
                        <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} />
                        <Area type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2} fill="url(#rg)" dot={{ r: 3, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── TAB: Attendance ── */}
          {tab === 'attendance' && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-[#111827]">Subject-wise Attendance</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Subject</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Present</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Total</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Percentage</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a.subjectName} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-xs font-medium text-[#111827]">{a.subjectName}</td>
                      <td className="px-3 py-3 text-xs text-[#6B7280]">{a.present}</td>
                      <td className="px-3 py-3 text-xs text-[#6B7280]">{a.total}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${a.percentage < 75 ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${a.percentage}%` }} /></div>
                          <span className={`text-xs font-bold ${a.percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>{a.percentage}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${a.percentage >= 75 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {a.percentage >= 75 ? 'Regular' : 'Defaulter'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB: Marks ── */}
          {tab === 'marks' && (
            <>
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                <h3 className="text-xs font-semibold text-[#111827] mb-3">Assessment Scores</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assessments.map(a => ({ name: `${a.subject.slice(0, 8)} ${assessmentLabel(a.type)}`, score: a.marksObtained, max: a.maxMarks, pct: Math.round((a.marksObtained / a.maxMarks) * 100) }))} barSize={24}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {assessments.map((a, i) => <Cell key={i} fill={(a.marksObtained / a.maxMarks) * 100 < 40 ? '#DC2626' : '#2563EB'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Subject</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Assessment</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Marks</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a, i) => {
                      const pct = Math.round((a.marksObtained / a.maxMarks) * 100);
                      return (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="px-4 py-2.5 text-xs font-medium text-[#111827]">{a.subject}</td>
                          <td className="px-3 py-2.5 text-xs text-[#6B7280]">{assessmentLabel(a.type)}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-[#111827]">{a.marksObtained}/{a.maxMarks}</td>
                          <td className="px-3 py-2.5"><span className={`text-xs font-bold ${pct < 40 ? 'text-red-600' : 'text-green-600'}`}>{pct}%</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── TAB: Assignments ── */}
          {tab === 'assignments' && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Assignment</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Status</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Marks</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#6B7280]">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, i) => {
                    const statusLabel = a.status === 'submitted_on_time' ? 'On Time' : a.status === 'submitted_late' ? 'Late' : 'Missing';
                    const statusClass = a.status === 'submitted_on_time' ? 'bg-green-50 text-green-700 border-green-200' : a.status === 'submitted_late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200';
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-xs font-medium text-[#111827]">{a.title}</td>
                        <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${statusClass}`}>{statusLabel}</span></td>
                        <td className="px-3 py-2.5 text-xs text-[#111827]">{a.marksObtained != null ? `${a.marksObtained}/${a.maxMarks}` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-[#6B7280]">{a.dueDate ? formatDate(a.dueDate) : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TAB: Actions ── */}
          {tab === 'actions' && (
            <>
              {/* New Action button */}
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-[#111827]">Interventions & Follow-ups</h3>
                <button onClick={() => setShowActionForm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white rounded text-xs font-medium hover:bg-[#1D4ED8] transition-colors">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  New Action
                </button>
              </div>

              {/* Action form */}
              {showActionForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Action Type</label>
                      <select value={actionForm.actionType} onChange={e => setActionForm(f => ({ ...f, actionType: e.target.value }))}
                        className="mt-1 w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]">
                        <option value="counseling">Counseling</option>
                        <option value="extra_class">Extra Class</option>
                        <option value="academic_support">Academic Support</option>
                        <option value="parent_meeting">Parent Meeting</option>
                        <option value="peer_mentoring">Peer Mentoring</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Date</label>
                      <input type="date" value={actionForm.date} onChange={e => setActionForm(f => ({ ...f, date: e.target.value }))}
                        className="mt-1 w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-[#6B7280] uppercase">Description</label>
                    <textarea value={actionForm.description} onChange={e => setActionForm(f => ({ ...f, description: e.target.value }))}
                      rows={2} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      placeholder="Describe the intervention…" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowActionForm(false)} className="px-3 py-1.5 border border-gray-300 rounded text-xs text-[#6B7280] hover:bg-gray-50">Cancel</button>
                    <button onClick={handleCreateAction} disabled={saving || !actionForm.description.trim()}
                      className="px-4 py-1.5 bg-[#2563EB] text-white rounded text-xs font-semibold hover:bg-[#1D4ED8] disabled:opacity-40 transition-colors">
                      {saving ? 'Saving…' : 'Create Action'}
                    </button>
                  </div>
                </div>
              )}

              {/* Actions list */}
              {actions.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#6B7280]">No actions recorded yet. Click &quot;New Action&quot; to start.</p>
              ) : (
                <div className="space-y-3">
                  {actions.map(a => (
                    <div key={a.id} className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-semibold text-[#111827]">{actionLabel(a.actionType)}</p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">{a.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {a.status !== 'completed' && (
                            <button onClick={() => handleUpdateActionStatus(a.id, 'completed')}
                              className="px-2 py-0.5 border border-green-200 text-green-700 bg-green-50 rounded text-[10px] font-semibold hover:bg-green-100 transition-colors">
                              ✓ Complete
                            </button>
                          )}
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                            a.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            a.status === 'cancelled' ? 'bg-gray-50 text-gray-500 border-gray-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>{a.status}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#6B7280]">{formatDate(a.date)}</p>
                      {a.outcome && <p className="mt-2 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">Outcome: {a.outcome}</p>}

                      {/* Remarks */}
                      {a.remarks.length > 0 && (
                        <div className="mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
                          {a.remarks.map(r => (
                            <div key={r.id}>
                              <p className="text-[11px] text-[#111827]">{r.text}</p>
                              <p className="text-[10px] text-[#6B7280]">{formatDate(r.createdAt)}{r.followUpDate ? ` · Follow-up: ${formatDate(r.followUpDate)}` : ''}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add remark */}
                      {remarkActionId === a.id ? (
                        <div className="mt-3 space-y-2">
                          <textarea value={remarkText} onChange={e => setRemarkText(e.target.value)}
                            rows={2} className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                            placeholder="Add a remark or follow-up note…" />
                          <div className="flex items-center gap-2">
                            <input type="date" value={remarkFollowUp} onChange={e => setRemarkFollowUp(e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#2563EB]" placeholder="Follow-up date" />
                            <div className="ml-auto flex gap-2">
                              <button onClick={() => { setRemarkActionId(null); setRemarkText(''); }} className="px-2 py-1 text-[10px] text-[#6B7280] border border-gray-200 rounded hover:bg-gray-50">Cancel</button>
                              <button onClick={handleAddRemark} disabled={!remarkText.trim()} className="px-3 py-1 text-[10px] font-semibold bg-[#2563EB] text-white rounded hover:bg-[#1D4ED8] disabled:opacity-40">Save</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setRemarkActionId(a.id)} className="mt-2 text-[10px] font-medium text-[#2563EB] hover:underline">+ Add Remark</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
