'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TEACHER, STUDENTS, SUBJECTS, ASSESSMENTS,
  ASSIGNMENTS, INITIAL_MARKS, INITIAL_SUBMISSIONS, INITIAL_FLAGS,
  computeSubjectPercentage, getRiskLevel,
  type RiskLevel,
} from '@/src/lib/teacherData';

// ─── Risk Badge ──────────────────────────────────────────────────────────────
function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg: Record<RiskLevel, string> = {
    Low:      'bg-green-50 text-green-700 border-green-200',
    Medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    High:     'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  };
  const dot: Record<RiskLevel, string> = {
    Low: 'bg-green-500', Medium: 'bg-yellow-500',
    High: 'bg-orange-500', Critical: 'bg-red-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${cfg[level]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[level]}`} />
      {level}
    </span>
  );
}

// ─── Topbar ──────────────────────────────────────────────────────────────────
function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
        </button>
        <div className="text-xs text-right">
          <p className="font-medium text-gray-800">{TEACHER.name}</p>
          <p className="text-gray-400">{TEACHER.department}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const flags = INITIAL_FLAGS;

  // Compute summary stats across all subjects
  const allStudentIds = STUDENTS.map(s => s.id);

  // Students below threshold (< 40%) in at least one subject
  const belowThresholdIds = new Set<string>();
  STUDENTS.forEach(s => {
    SUBJECTS.forEach(sub => {
      const pct = computeSubjectPercentage(INITIAL_MARKS, s.id, sub.id);
      if (pct < 40) belowThresholdIds.add(s.id);
    });
  });

  // Overall assignment submission rate (across all assignments)
  const totalSubmissions = ASSIGNMENTS.length * STUDENTS.length;
  let submittedCount = 0;
  ASSIGNMENTS.forEach(a => {
    STUDENTS.forEach(s => {
      const rec = INITIAL_SUBMISSIONS[a.id]?.[s.id];
      if (rec && rec.status !== 'Not Submitted') submittedCount++;
    });
  });
  const submissionRate = Math.round((submittedCount / totalSubmissions) * 100);

  // Overall avg marks (% across all students, all subjects)
  let totalPct = 0;
  STUDENTS.forEach(s => {
    SUBJECTS.forEach(sub => {
      totalPct += computeSubjectPercentage(INITIAL_MARKS, s.id, sub.id);
    });
  });
  const avgMarks = Math.round(totalPct / (STUDENTS.length * SUBJECTS.length));

  // Per-subject stats
  const subjectStats = SUBJECTS.map(sub => {
    const avgPct = Math.round(
      STUDENTS.reduce((acc, s) => acc + computeSubjectPercentage(INITIAL_MARKS, s.id, sub.id), 0) / STUDENTS.length
    );
    const below = STUDENTS.filter(s => computeSubjectPercentage(INITIAL_MARKS, s.id, sub.id) < 40).length;

    // Submission rate for this subject's assignments
    const subAssignments = ASSIGNMENTS.filter(a => a.subjectId === sub.id);
    let subSubmitted = 0;
    subAssignments.forEach(a => {
      STUDENTS.forEach(s => {
        if (INITIAL_SUBMISSIONS[a.id]?.[s.id]?.status !== 'Not Submitted') subSubmitted++;
      });
    });
    const subSubRate = subAssignments.length > 0
      ? Math.round((subSubmitted / (subAssignments.length * STUDENTS.length)) * 100)
      : 0;

    return { ...sub, avgPct, below, subSubRate };
  });

  // Risk distribution
  const riskCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  STUDENTS.forEach(s => {
    // Use average pct across subjects for overall risk
    const avgPct = Math.round(
      SUBJECTS.reduce((acc, sub) => acc + computeSubjectPercentage(INITIAL_MARKS, s.id, sub.id), 0) / SUBJECTS.length
    );
    riskCounts[getRiskLevel(avgPct)]++;
  });

  // Upcoming deadlines
  const today = new Date('2026-04-18');
  const upcoming = ASSIGNMENTS
    .filter(a => new Date(a.dueDate) >= today)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const flaggedStudents = STUDENTS.filter(s => flags[s.id]);
  const [activeSubject, setActiveSubject] = useState('DS');

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Teacher Dashboard" subtitle={`Welcome back, ${TEACHER.name} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} />

      <main className="flex-1 p-6 space-y-6">

        {/* ── Summary Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Total Students',
              value: STUDENTS.length,
              sub: '2 batches · Semester 3',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              accent: 'bg-blue-50',
            },
            {
              label: 'Below Threshold',
              value: belowThresholdIds.size,
              sub: `${Math.round((belowThresholdIds.size / STUDENTS.length) * 100)}% of class`,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              ),
              accent: 'bg-red-50',
            },
            {
              label: 'Submission Rate',
              value: `${submissionRate}%`,
              sub: `${submittedCount} of ${totalSubmissions} submitted`,
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              accent: 'bg-green-50',
            },
            {
              label: 'Class Average',
              value: `${avgMarks}%`,
              sub: 'Across all subjects',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              accent: 'bg-orange-50',
            },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className={`w-8 h-8 rounded-lg ${c.accent} flex items-center justify-center mb-3`}>
                {c.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* ── Subject Overview ──────────────────────────────────────── */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Subject Overview</h2>
              <div className="flex gap-1">
                {SUBJECTS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSubject(s.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${activeSubject === s.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {s.id}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Student</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Batch</th>
                    {ASSESSMENTS.map(a => (
                      <th key={a.id} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">{a.label}<span className="font-normal text-gray-400"> /{a.maxMarks}</span></th>
                    ))}
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Total %</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Risk</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {STUDENTS.map(s => {
                    const marks = INITIAL_MARKS[s.id]?.[activeSubject] ?? {};
                    const pct = computeSubjectPercentage(INITIAL_MARKS, s.id, activeSubject);
                    const risk = getRiskLevel(pct);
                    const isFlagged = !!flags[s.id];
                    const isBelowThreshold = pct < 40;
                    return (
                      <tr key={s.id} className={`border-b border-gray-50 ${isBelowThreshold ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            {isFlagged && (
                              <span title={flags[s.id].note} className="text-orange-500 shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                              </span>
                            )}
                            <span className="font-medium text-gray-800 text-xs">{s.name}</span>
                          </div>
                          <p className="text-xs text-gray-400 pl-5">{s.id.toUpperCase()}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500">{s.batch}</td>
                        {ASSESSMENTS.map(a => {
                          const m = marks[a.id];
                          const pctA = m != null ? (m / a.maxMarks) * 100 : null;
                          const isLow = pctA != null && pctA < 40;
                          return (
                            <td key={a.id} className={`px-3 py-2.5 text-xs font-medium ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                              {m ?? <span className="text-gray-300">—</span>}
                            </td>
                          );
                        })}
                        <td className={`px-3 py-2.5 text-xs font-bold ${isBelowThreshold ? 'text-red-600' : 'text-gray-800'}`}>{pct}%</td>
                        <td className="px-3 py-2.5"><RiskBadge level={risk} /></td>
                        <td className="px-3 py-2.5">
                          {isFlagged
                            ? <span className="text-xs text-orange-600 font-medium">⚠ Flagged</span>
                            : <span className="text-xs text-gray-300">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right Panel ──────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Risk Distribution */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Risk Distribution</h3>
              <div className="space-y-2">
                {(Object.entries(riskCounts) as [RiskLevel, number][]).map(([level, count]) => {
                  const pct = Math.round((count / STUDENTS.length) * 100);
                  const colors: Record<RiskLevel, string> = { Low: 'bg-green-500', Medium: 'bg-yellow-500', High: 'bg-orange-500', Critical: 'bg-red-500' };
                  return (
                    <div key={level}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{level}</span>
                        <span className="text-gray-500">{count} students ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div className={`h-1.5 rounded-full ${colors[level]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flagged Students */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Flagged Students</h3>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">{flaggedStudents.length}</span>
              </div>
              <div className="space-y-3">
                {flaggedStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No students flagged</p>
                ) : (
                  flaggedStudents.map(s => (
                    <div key={s.id} className="border border-orange-100 bg-orange-50/50 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-500 text-xs">⚠</span>
                        <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                        <span className="text-xs text-gray-400 ml-auto">{flags[s.id].flaggedAt}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{flags[s.id].note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Upcoming Deadlines</h3>
              <div className="space-y-2">
                {upcoming.map(a => {
                  const sub = SUBJECTS.find(s => s.id === a.subjectId);
                  const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - today.getTime()) / 86400000);
                  return (
                    <div key={a.id} className="flex items-start gap-2">
                      <div className={`shrink-0 text-xs font-bold w-8 text-center rounded py-0.5 ${daysLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{daysLeft}d</div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 leading-tight">{a.title}</p>
                        <p className="text-xs text-gray-400">{sub?.name} · Due {a.dueDate}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Links ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: '/teacher/marks',       label: 'Enter Marks',          desc: 'Spreadsheet-style marks entry for all assessments',  icon: '📝' },
            { href: '/teacher/assignments',  label: 'Manage Assignments',   desc: 'Create assignments and update student submissions',   icon: '📋' },
            { href: '/teacher/analytics',   label: 'View Analytics',       desc: 'Charts, distributions, and below-threshold reports', icon: '📊' },
          ].map(q => (
            <Link key={q.href} href={q.href} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all flex items-start gap-3">
              <span className="text-xl">{q.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{q.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{q.desc}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 ml-auto mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}
