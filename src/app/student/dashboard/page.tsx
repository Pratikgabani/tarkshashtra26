"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy-load recharts components (client-only)
const RiskChart = dynamic(() => import("@/src/components/student/RiskChart"), { ssr: false });

// ─── Types ────────────────────────────────────────────────

interface RiskFactor {
  factor: string;
  label: string;
  currentValue: number;
  threshold: number;
  unit: string;
  weight: number;
  contribution: number;
  suggestion: string;
}

interface RiskScoreData {
  score: number;
  riskLevel: string;
  factors: RiskFactor[];
  calculatedAt: string;
}

interface SubjectPerformance {
  subjectId: string;
  name: string;
  code: string;
  attendance: number;
  marksPercent: number;
  completionRate: number;
  assessments: { type: string; marksObtained: number; maxMarks: number; date: string }[];
  assignments: { title: string; status: string; dueDate: string; marksObtained: number | null; maxMarks: number }[];
}

interface PendingAssignment {
  title: string;
  subjectName: string;
  dueDate: string;
  maxMarks: number;
}

interface AlertItem {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  status: string;
  sentAt: string;
  actionLink?: string;
}

interface RiskHistoryPoint {
  score: number;
  riskLevel: string;
  date: string;
}

interface OverallStats {
  attendance: number;
  marksPercent: number;
  assignmentCompletionRate: number;
  lateSubmissions: number;
  avgLoginsPerWeek: number;
  pendingAssignmentCount: number;
}

interface StudentInfo {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  batch: string;
}

interface DashboardData {
  student: StudentInfo;
  riskScore: RiskScoreData;
  motivationalMessage: string;
  overallStats: OverallStats;
  subjectPerformance: SubjectPerformance[];
  pendingAssignments: PendingAssignment[];
  riskHistory: RiskHistoryPoint[];
  alerts: AlertItem[];
}

// ─── Helpers ──────────────────────────────────────────────

const RISK_STYLES: Record<string, { pill: string; ring: string; icon: string }> = {
  low:      { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", ring: "ring-emerald-500", icon: "🟢" },
  medium:   { pill: "bg-amber-50 text-amber-700 border-amber-200",       ring: "ring-amber-500",   icon: "🟡" },
  high:     { pill: "bg-orange-50 text-orange-700 border-orange-200",     ring: "ring-orange-500",  icon: "🟠" },
  critical: { pill: "bg-red-50 text-red-700 border-red-200",             ring: "ring-red-500",     icon: "🔴" },
};

function riskStyle(level: string) {
  return RISK_STYLES[level] || RISK_STYLES.medium;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function assessmentLabel(t: string) {
  return { unit_test_1: "UT 1", unit_test_2: "UT 2", midterm: "Mid-Term", endterm: "End-Term" }[t] ?? t;
}

function statusBadge(s: string) {
  if (s === "submitted_on_time") return { text: "On Time", cls: "bg-emerald-50 text-emerald-700" };
  if (s === "submitted_late") return { text: "Late", cls: "bg-amber-50 text-amber-700" };
  return { text: "Missing", cls: "bg-red-50 text-red-700" };
}

function priorityAccent(p: string) {
  if (p === "critical") return "border-l-red-500";
  if (p === "high") return "border-l-orange-400";
  if (p === "medium") return "border-l-amber-400";
  return "border-l-primary";
}

// ─── Stat Card ────────────────────────────────────────────

function StatCard({ label, value, warn, icon }: { label: string; value: string; warn: boolean; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${warn ? "bg-orange-50 text-orange-500" : "bg-primary/5 text-primary"}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className={`mt-0.5 text-lg font-semibold leading-none ${warn ? "text-orange-600" : "text-text-primary"}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Icons (inline SVGs) ──────────────────────────────────

const icons = {
  attendance: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  marks: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
    </svg>
  ),
  assignments: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  ),
  late: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  lms: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
    </svg>
  ),
  pending: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
};

// ─── Dashboard Page ───────────────────────────────────────

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("overview");

  const fetchDashboard = useCallback(async () => {
    try {
      const stored = localStorage.getItem("shikshasetu_user");
      if (!stored) { window.location.href = "/login"; return; }
      const user = JSON.parse(stored);
      if (user.role !== "student") { window.location.href = "/login"; return; }

      const res = await fetch(`/api/student/dashboard?studentId=${user.id}`);
      const json = await res.json();
      if (!res.ok) { setError(json.message || "Failed to load dashboard"); return; }
      setData(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ─── Loading ─────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          <p className="text-sm text-text-secondary">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen px-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Unable to load dashboard</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <button onClick={() => { setLoading(true); setError(""); fetchDashboard(); }} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors">Retry</button>
        </div>
      </div>
    );
  }

  const { student, riskScore, motivationalMessage, overallStats, subjectPerformance, pendingAssignments, riskHistory, alerts } = data;
  const rs = riskStyle(riskScore?.riskLevel || "medium");
  const topFactors = [...(riskScore?.factors || [])].sort((a, b) => b.contribution - a.contribution).slice(0, 3);
  const unread = alerts.filter((a) => a.status === "unread").length;

  // Donut percentage for risk score
  const scoreAngle = ((riskScore?.score ?? 0) / 100) * 283;

  return (
    <div className="min-h-screen bg-background">
      {/* ───── Header ───── */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between px-5">
          <Link href="/student/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-[18px] w-[18px] text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
            </div>
            <span className="text-[15px] font-semibold text-text-primary tracking-tight">ShikshaSetu</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "subjects", label: "Subjects" },
              { id: "alerts", label: "Alerts" },
            ].map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  setActiveNav(n.id);
                  document.getElementById(`section-${n.id}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeNav === n.id
                    ? "bg-primary/5 text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-gray-50"
                }`}
              >
                {n.label}
                {n.id === "alerts" && unread > 0 && (
                  <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {student.fullName.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="leading-none">
                <p className="text-sm font-medium text-text-primary">{student.fullName}</p>
                <p className="text-[11px] text-text-secondary">{student.studentId} · {student.department}</p>
              </div>
            </div>
            <button
              onClick={() => { localStorage.removeItem("shikshasetu_user"); window.location.href = "/login"; }}
              className="rounded-md border border-border p-2 text-text-secondary hover:bg-gray-50 transition-colors"
              title="Sign out"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* ───── Main ───── */}
      <main className="mx-auto max-w-[1360px] px-5 py-6 space-y-6" id="section-overview">

        {/* ── Row 1: Risk Score Hero + Quick Stats ── */}
        <div className="grid gap-5 lg:grid-cols-12">

          {/* Risk Score Card */}
          <div className="lg:col-span-4 rounded-2xl border border-border bg-surface p-6 flex flex-col items-center text-center">
            {/* Donut */}
            <div className="relative h-36 w-36">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={riskScore?.riskLevel === "low" ? "#10b981" : riskScore?.riskLevel === "medium" ? "#f59e0b" : riskScore?.riskLevel === "high" ? "#f97316" : "#ef4444"}
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${scoreAngle} 283`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-text-primary">{riskScore?.score ?? "--"}</span>
                <span className="text-[11px] text-text-secondary">out of 100</span>
              </div>
            </div>

            <span className={`mt-4 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${rs.pill}`}> 
              {riskStyle(riskScore?.riskLevel || "").icon} {riskScore?.riskLevel || "N/A"} Risk
            </span>

            <p className="mt-3 text-sm text-text-secondary leading-relaxed max-w-[260px]">{motivationalMessage}</p>
            <p className="mt-2 text-[11px] text-text-secondary">
              Updated {riskScore?.calculatedAt ? formatDate(riskScore.calculatedAt) : "N/A"}
            </p>
          </div>

          {/* Right column: Stats + Top Factors */}
          <div className="lg:col-span-8 space-y-5">

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              <StatCard label="Attendance" value={`${overallStats.attendance}%`} warn={overallStats.attendance < 75} icon={icons.attendance} />
              <StatCard label="Avg. Internal Marks" value={`${overallStats.marksPercent}%`} warn={overallStats.marksPercent < 40} icon={icons.marks} />
              <StatCard label="Assignments Done" value={`${overallStats.assignmentCompletionRate}%`} warn={overallStats.assignmentCompletionRate < 70} icon={icons.assignments} />
              <StatCard label="Late Submissions" value={String(overallStats.lateSubmissions)} warn={overallStats.lateSubmissions > 2} icon={icons.late} />
              <StatCard label="LMS Logins / Week" value={String(overallStats.avgLoginsPerWeek)} warn={overallStats.avgLoginsPerWeek < 3} icon={icons.lms} />
              <StatCard label="Pending Tasks" value={String(overallStats.pendingAssignmentCount)} warn={overallStats.pendingAssignmentCount > 0} icon={icons.pending} />
            </div>

            {/* Top Contributing Factors */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-text-primary">Top Contributing Factors</h2>
              <p className="text-xs text-text-secondary">Primary reasons affecting your risk score</p>

              <div className="mt-4 divide-y divide-border">
                {topFactors.map((f, idx) => {
                  const isBad = f.factor === "submission_timeliness" ? f.currentValue > f.threshold : f.currentValue < f.threshold;
                  const pct = f.factor === "submission_timeliness"
                    ? Math.min(100, (f.threshold / Math.max(f.currentValue, 1)) * 100)
                    : Math.min(100, (f.currentValue / f.threshold) * 100);

                  return (
                    <div key={f.factor} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold ${isBad ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-text-primary">{f.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`font-semibold ${isBad ? "text-orange-600" : "text-emerald-600"}`}>
                            {f.currentValue}{f.unit === "%" ? "%" : ` ${f.unit}`}
                          </span>
                          <span className="text-text-secondary">
                            / {f.threshold}{f.unit === "%" ? "%" : ` ${f.unit}`}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                            {f.contribution}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isBad ? "bg-orange-400" : "bg-emerald-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <p className="mt-1.5 text-xs text-text-secondary leading-relaxed">{f.suggestion}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Risk History Chart + Notifications ── */}
        <div className="grid gap-5 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold text-text-primary">Risk Score Trend</h2>
            <p className="text-xs text-text-secondary">Your risk score over the past 8 weeks</p>
            <div className="mt-4 h-[260px]">
              <RiskChart history={riskHistory} />
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-border bg-surface p-5" id="section-alerts">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Notifications</h2>
                <p className="text-xs text-text-secondary">{unread} unread</p>
              </div>
              {unread > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread}</span>
              )}
            </div>
            <div className="mt-4 space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-secondary">All caught up — no notifications.</p>
              ) : alerts.map((a) => (
                <div key={a.id} className={`rounded-lg border border-border border-l-[3px] p-3 ${priorityAccent(a.priority)} ${a.status === "unread" ? "bg-gray-50/80" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-text-primary leading-snug">{a.title}</p>
                    {a.status === "unread" && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 text-[11px] text-text-secondary leading-relaxed line-clamp-2">{a.message}</p>
                  <p className="mt-1 text-[10px] text-text-secondary">{formatDate(a.sentAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 3: Subject Performance ── */}
        <div id="section-subjects">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Subject-Wise Performance</h2>
            <p className="text-xs text-text-secondary">Detailed breakdown for each enrolled subject</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {subjectPerformance.map((subj) => {
              const isExpanded = expandedSubject === subj.subjectId;
              const metrics = [
                { label: "Attendance", value: subj.attendance, warn: subj.attendance < 75 },
                { label: "Marks", value: subj.marksPercent, warn: subj.marksPercent < 40 },
                { label: "Assignments", value: subj.completionRate, warn: subj.completionRate < 70 },
              ];

              return (
                <div key={subj.subjectId} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-[13px] font-semibold text-text-primary">{subj.name}</h3>
                        <p className="text-[11px] text-text-secondary">{subj.code}</p>
                      </div>
                      <button
                        onClick={() => setExpandedSubject(isExpanded ? null : subj.subjectId)}
                        className="rounded-md p-1 text-text-secondary hover:bg-gray-100 transition-colors"
                        aria-label="Toggle details"
                      >
                        <svg className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                    </div>

                    {/* Metric bars */}
                    <div className="mt-4 space-y-3">
                      {metrics.map((m) => (
                        <div key={m.label}>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-text-secondary">{m.label}</span>
                            <span className={`font-semibold ${m.warn ? "text-orange-600" : "text-text-primary"}`}>{m.value}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${m.warn ? "bg-orange-400" : "bg-primary/70"}`} style={{ width: `${m.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Assessment mini chart */}
                    {subj.assessments.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-border">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary mb-2">Assessment Scores</p>
                        <div className="flex items-end gap-2">
                          {subj.assessments.map((a, i) => {
                            const pct = Math.round((a.marksObtained / a.maxMarks) * 100);
                            return (
                              <div key={i} className="flex-1 text-center">
                                <div className="mx-auto h-14 flex items-end justify-center">
                                  <div
                                    className={`w-full max-w-[28px] rounded-t-sm transition-all ${pct < 40 ? "bg-orange-300" : "bg-primary/50"}`}
                                    style={{ height: `${Math.max(12, pct)}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-[9px] font-medium text-text-primary">{a.marksObtained}</p>
                                <p className="text-[8px] text-text-secondary">{assessmentLabel(a.type)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded: assignment list */}
                  {isExpanded && (
                    <div className="border-t border-border bg-gray-50/60 p-4 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Assignment Status</p>
                      {subj.assignments.length === 0 ? (
                        <p className="text-xs text-text-secondary">No assignments.</p>
                      ) : subj.assignments.map((a, i) => {
                        const badge = statusBadge(a.status);
                        return (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-surface border border-border px-3 py-2">
                            <div className="min-w-0 mr-2">
                              <p className="text-xs font-medium text-text-primary truncate">{a.title}</p>
                              <p className="text-[10px] text-text-secondary">Due {formatDate(a.dueDate)}{a.marksObtained != null ? ` · ${a.marksObtained}/${a.maxMarks}` : ""}</p>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Row 4: Pending Assignments ── */}
        {pendingAssignments.length > 0 && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100">
                <svg className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Pending Assignments</h2>
                <p className="text-xs text-text-secondary">{pendingAssignments.length} assignment{pendingAssignments.length > 1 ? "s" : ""} need your attention</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingAssignments.map((pa, i) => (
                <div key={i} className="rounded-xl border border-orange-200 bg-surface p-4">
                  <p className="text-sm font-medium text-text-primary">{pa.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">{pa.subjectName}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-600">Due: {formatDate(pa.dueDate)}</span>
                    <span className="text-xs text-text-secondary">{pa.maxMarks} marks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
