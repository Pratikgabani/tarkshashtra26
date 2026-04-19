'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { 
  fetchStudentDashboardData,
  formatRelativeDate,
  toUiRiskLevel,
  type StudentDashboardData,
  type StudentSubjectPerformance,
  type UiRiskLevel,
} from '@/src/lib/studentDashboardClient';
import { 
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Bell, ChevronRight, TrendingUp, TrendingDown, BookOpen, Clock, AlertTriangle, Calendar, FileText, LineChart as TrendChartIcon } from 'lucide-react';

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

// ─── Reusable Topbar ────────────────────────────────────────────────────────
function Topbar({
  title,
  subtitle,
  onOpenAlerts,
  unreadCount,
}: {
  title: string;
  subtitle?: string;
  onOpenAlerts: () => void;
  unreadCount: number;
}) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenAlerts}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors bg-gray-50 border border-gray-200"
        >
          <Bell className="w-4 h-4 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border-2 border-white" />
          )}
        </button>
      </div>
    </div>
  );
}

interface RiskHistoryItem {
  week: string;
  score: number;
  date: string;
  riskLevel: string;
  intervention?: boolean;
}

interface ChartTooltipEntry {
  color?: string;
  value: number;
  payload: RiskHistoryItem;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

interface DotRenderProps {
  cx?: number;
  cy?: number;
  payload?: RiskHistoryItem;
}

function CustomChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length > 0) {
    const point = payload[0];
    return (
      <div className="bg-gray-900 border border-gray-800 text-white p-3 rounded-lg shadow-xl">
        <p className="text-xs font-bold mb-1">{label}</p>
        <p className="text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: point.color || '#3B82F6' }} />
          Score: {point.value}
        </p>
        {point.payload.intervention && (
          <p className="text-[10px] text-blue-300 mt-2 bg-blue-900/30 px-2 py-1 rounded border border-blue-800">
            Mentor Intervention
          </p>
        )}
      </div>
    );
  }

  return null;
}

function renderDashboardDot({ cx, cy, payload }: DotRenderProps) {
  if (typeof cx !== 'number' || typeof cy !== 'number') return null;
  if (payload?.intervention) {
    return <circle cx={cx} cy={cy} r={6} fill="#EF4444" stroke="#fff" strokeWidth={2} />;
  }
  return <circle cx={cx} cy={cy} r={4} fill="#3B82F6" stroke="#fff" strokeWidth={2} />;
}

// ─── Risk Badge ─────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: UiRiskLevel }) {
  const cfg = {
    Low:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium:   'bg-amber-50 text-amber-700 border-amber-200',
    High:     'bg-orange-50 text-orange-700 border-orange-200',
  };
  const dots = {
    Low: 'bg-emerald-500', Medium: 'bg-amber-500', High: 'bg-orange-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${cfg[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[level]}`} />
      {level} Risk
    </span>
  );
}

function getSubjectRiskLevel(subject: StudentSubjectPerformance): UiRiskLevel {
  if (subject.attendance < 60 || subject.marksPercent < 40 || subject.completionRate < 60) return 'High';
  if (subject.attendance < 75 || subject.marksPercent < 55 || subject.completionRate < 80) return 'Medium';
  return 'Low';
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState('');
  const [pendingUploadAssignmentId, setPendingUploadAssignmentId] = useState('');
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const riskHistory: RiskHistoryItem[] = useMemo(() => {
    if (!data) return [];

    return data.riskHistory.map((point, index) => ({
      ...point,
      week:
        new Date(point.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) ||
        `Point ${index + 1}`,
    }));
  }, [data]);

  const referenceDateMs = useMemo(() => {
    if (!data) return null;
    const referenceIso = data.generatedAt || data.riskScore.calculatedAt;
    const parsed = new Date(referenceIso).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }, [data]);

  const pendingAssignments = useMemo(() => {
    if (!data) return [];

    return data.pendingAssignments.map((assignment) => {
      const dueMs = new Date(assignment.dueDate).getTime();
      const baseMs = referenceDateMs ?? dueMs;
      const rawDaysLeft = Number.isNaN(dueMs) ? 0 : Math.ceil((dueMs - baseMs) / 86400000);

      return {
        ...assignment,
        daysLeft: Math.max(rawDaysLeft, 0),
      };
    });
  }, [data, referenceDateMs]);

  useEffect(() => {
    async function loadData() {
      const result = await fetchStudentDashboardData();
      if (result.ok) {
        setData(result.data);
        setError('');
      } else {
        setError(result.message);
      }
      setLoading(false);
    }

    void loadData();
  }, []);

  async function handleSubmitAssignment(assignmentId: string, file: File) {
    if (!assignmentId || !file) return;

    const isPdfMimeType = file.type === 'application/pdf';
    const hasPdfExtension = file.name.toLowerCase().endsWith('.pdf');

    if (!isPdfMimeType && !hasPdfExtension) {
      setError('Only PDF files are allowed for assignment submissions.');
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setError('PDF must be 10MB or smaller.');
      return;
    }

    setSubmittingAssignmentId(assignmentId);
    setError('');
    setNotice('');

    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('file', file);

      const response = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();

      if (!response.ok || !json?.success) {
        setError(json?.message || 'Failed to submit assignment.');
        return;
      }

      const refreshed = await fetchStudentDashboardData();
      if (refreshed.ok) {
        setData(refreshed.data);
      }

      setNotice(json?.message || 'Assignment submitted successfully.');
    } catch {
      setError('Failed to submit assignment.');
    } finally {
      setSubmittingAssignmentId('');
      setPendingUploadAssignmentId('');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  }

  function openPdfPicker(assignmentId: string) {
    if (!assignmentId || submittingAssignmentId) return;
    setPendingUploadAssignmentId(assignmentId);
    setError('');
    setNotice('');
    uploadInputRef.current?.click();
  }

  function handlePdfSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !pendingUploadAssignmentId) {
      setPendingUploadAssignmentId('');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      return;
    }

    void handleSubmitAssignment(pendingUploadAssignmentId, file);
  }

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
          <p className="text-sm font-bold text-gray-900">Student dashboard unavailable</p>
          <p className="text-xs font-medium text-gray-500 mt-1">{error || 'Please refresh to retry.'}</p>
        </div>
      </div>
    );
  }

  const trendWorsening =
    riskHistory.length > 1
      ? riskHistory[riskHistory.length - 1].score > riskHistory[riskHistory.length - 2].score
      : false;

  const subjectPerformance = data.subjectPerformance;
  const topFactors = data.riskScore.factors.slice(0, 5);
  const unreadAlerts =
    typeof data.unreadAlertCount === 'number'
      ? data.unreadAlertCount
      : data.alerts.filter((alert) => alert.status === 'unread').length;

  // SVG Donut metrics
  const score = data.riskScore.score;
  const strokeDasharray = `${(score / 100) * 283} 283`;
  const strokeColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#f97316';

  return (
    <div className="flex flex-col flex-1">
      <Topbar
        title="Overview"
        subtitle="Review your analytical risk profile and performance."
        onOpenAlerts={() => {
          router.push('/student/alerts');
        }}
        unreadCount={unreadAlerts}
      />

      <main className="flex-1 p-8 space-y-8 overflow-auto max-w-7xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs font-semibold">
            {error}
          </div>
        )}

        {notice && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs font-semibold">
            {notice}
          </div>
        )}
        
        {/* ── Top Section: Risk Score & Quick Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Risk Score Hero Card */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-indigo-500" />
            
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

            <RiskBadge level={toUiRiskLevel(data.riskScore.riskLevel)} />

            <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-600">
              {data.motivationalMessage}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400">
              {trendWorsening ? <TrendingDown className="w-4 h-4 text-orange-500" /> : <TrendingUp className="w-4 h-4 text-green-500" />}
              <span suppressHydrationWarning>Updated {new Date(data.riskScore.calculatedAt).toLocaleDateString('en-GB')}</span>
            </div>
          </div>

          {/* Right Column: Factors & Stats */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Attendance', value: `${data.overallStats.attendance}%`, warn: data.overallStats.attendance < 75 },
                { label: 'Assignments', value: `${data.overallStats.assignmentCompletionRate}%`, warn: data.overallStats.assignmentCompletionRate < 85 },
                { label: 'Late Subs', value: data.overallStats.lateSubmissions, warn: data.overallStats.lateSubmissions > 1 },
                { label: 'Pending', value: data.overallStats.pendingAssignments, warn: data.overallStats.pendingAssignments > 0 },
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
                {topFactors.length === 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-500">
                    Risk factor details are being prepared. Please check back in a moment.
                  </div>
                )}
                {topFactors.map((f, i) => {
                  const inverseFactor = f.factor === 'submission_timeliness';
                  const isBad = inverseFactor ? f.currentValue > f.threshold : f.currentValue < f.threshold;
                  const pct = inverseFactor
                    ? Math.min(100, (f.threshold / Math.max(f.currentValue, 1)) * 100)
                    : Math.min(100, (f.currentValue / Math.max(f.threshold, 1)) * 100);

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
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${isBad ? 'bg-linear-to-r from-orange-400 to-red-500' : 'bg-emerald-500'}`} 
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
              {subjectPerformance.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs font-semibold text-gray-500">
                  Subject performance is not available yet.
                </div>
              )}
              {subjectPerformance.map(s => (
                <Link 
                  href={`/student/subjects?id=${s.subjectId}`} 
                  key={s.subjectId}
                  className="block bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{s.name}</h4>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">{s.faculty}</p>
                    </div>
                    <RiskBadge level={getSubjectRiskLevel(s)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><FileText className="w-3 h-3"/> Internal Marks</p>
                      <p className="text-lg font-black text-gray-800">{s.marksPercent}<span className="text-xs font-bold text-gray-400">%</span></p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><BookOpen className="w-3 h-3"/> Assignments</p>
                      <p className="text-lg font-black text-gray-800">{s.completionRate}<span className="text-xs font-bold text-gray-400">%</span></p>
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
                <TrendChartIcon className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="flex-1 w-full min-h-75">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsLineChart data={riskHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    dot={renderDashboardDot}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#2563EB' }}
                  />
                </RechartsLineChart>
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
              <input
                ref={uploadInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={handlePdfSelected}
              />

              {pendingAssignments.length === 0 && (
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-xs font-semibold text-green-700">
                  No pending assignments right now. Keep it up.
                </div>
              )}

              {pendingAssignments.map(pa => {
                return (
                  <div key={pa.assignmentId || `${pa.title}-${pa.dueDate}`} className="bg-orange-50/50 border border-orange-100 rounded-lg p-4 flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-white border border-orange-200 flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Due in</span>
                      <span className="text-lg font-black text-orange-600 leading-none">{pa.daysLeft}d</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{pa.title}</h4>
                      <p className="text-xs font-semibold text-gray-500 mt-1">{pa.subjectName} • Max {pa.maxMarks} marks</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        openPdfPicker(pa.assignmentId);
                      }}
                      disabled={!pa.assignmentId || submittingAssignmentId === pa.assignmentId}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-60"
                    >
                      {submittingAssignmentId === pa.assignmentId ? 'Submitting...' : 'Submit PDF'}
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
              {data.alerts.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs font-semibold text-gray-500">
                  No recent alerts.
                </div>
              )}
              {data.alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className={`p-4 rounded-xl border flex gap-3 ${alert.status === 'unread' ? 'bg-blue-50/30 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="mt-1">
                    {alert.priority === 'high' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Calendar className="w-4 h-4 text-blue-500" />}
                  </div>
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-gray-900">{alert.title}</h4>
                      <span className="text-[10px] font-bold text-gray-400">{formatRelativeDate(alert.sentAt)}</span>
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
