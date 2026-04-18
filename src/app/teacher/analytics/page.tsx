'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, type PieLabelRenderProps,
} from 'recharts';
import {
  STUDENTS, SUBJECTS, ASSESSMENTS, ASSIGNMENTS,
  INITIAL_MARKS, INITIAL_SUBMISSIONS,
  computeSubjectPercentage, getRiskLevel,
  type RiskLevel, type Student,
} from '@/src/lib/teacherData';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg: Record<RiskLevel, string> = {
    Low:      'bg-green-50 text-green-700 border-green-200',
    Medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    High:     'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${cfg[level]}`}>
      {level}
    </span>
  );
}

// Custom pie label rendered inside each slice
function renderPieLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    typeof cx !== 'number' || typeof cy !== 'number' ||
    typeof midAngle !== 'number' || typeof innerRadius !== 'number' ||
    typeof outerRadius !== 'number' || typeof percent !== 'number'
  ) return null;
  if (percent < 0.08) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

interface AssessmentBar { name: string; avg: number; pct: number; max: number; }
interface BinData      { range: string; count: number; low: number; }
interface PieEntry     { name: string; value: number; color: string; }
interface StudentSummary extends Student {
  pct: number; risk: RiskLevel;
  marks: (number | null)[];
  subOnTime: number; subLate: number; subMissing: number;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: '#16A34A', Medium: '#CA8A04', High: '#EA580C', Critical: '#DC2626',
};

export default function AnalyticsPage() {
  const [activeSubject, setActive] = useState(SUBJECTS[0].id);

  const subject       = SUBJECTS.find(s => s.id === activeSubject)!;
  const subAssignments = ASSIGNMENTS.filter(a => a.subjectId === activeSubject);

  // ── Bar chart data ────────────────────────────────────────────────────────
  const avgPerAssessment: AssessmentBar[] = ASSESSMENTS.map(a => {
    const vals = STUDENTS.map(s => INITIAL_MARKS[s.id]?.[activeSubject]?.[a.id] ?? 0);
    const avg  = vals.reduce((x: number, y: number) => x + y, 0) / vals.length;
    return { name: a.label, avg: Math.round(avg * 10) / 10, pct: Math.round((avg / a.maxMarks) * 100), max: a.maxMarks };
  });

  // ── Distribution bins ─────────────────────────────────────────────────────
  const bins: BinData[] = ['0–10','10–20','20–30','30–40','40–50','50–60','60–70','70–80','80–90','90–100'].map((r, i) => ({ range: r, count: 0, low: i * 10 }));
  STUDENTS.forEach(s => {
    const pct = computeSubjectPercentage(INITIAL_MARKS, s.id, activeSubject);
    const idx = Math.min(Math.floor(pct / 10), 9);
    bins[idx].count++;
  });

  // ── Pie chart data ────────────────────────────────────────────────────────
  let onTimeCount = 0, lateCount = 0, missingCount = 0;
  subAssignments.forEach(a => {
    STUDENTS.forEach(s => {
      const rec = INITIAL_SUBMISSIONS[a.id]?.[s.id];
      if (!rec || rec.status === 'Not Submitted') missingCount++;
      else if (rec.status === 'Late') lateCount++;
      else onTimeCount++;
    });
  });
  const pieData: PieEntry[] = [
    { name: 'On Time',       value: onTimeCount,  color: '#16A34A' },
    { name: 'Late',          value: lateCount,    color: '#CA8A04' },
    { name: 'Not Submitted', value: missingCount, color: '#DC2626' },
  ];

  // ── Summary stats ─────────────────────────────────────────────────────────
  const allPcts   = STUDENTS.map(s => computeSubjectPercentage(INITIAL_MARKS, s.id, activeSubject));
  const classAvg  = Math.round(allPcts.reduce((a: number, b: number) => a + b, 0) / allPcts.length);
  const highest   = Math.max(...allPcts);
  const lowest    = Math.min(...allPcts);
  const totalSubs = subAssignments.length * STUDENTS.length;
  const subRate   = totalSubs > 0 ? Math.round(((onTimeCount + lateCount) / totalSubs) * 100) : 0;

  // ── Risk distribution ─────────────────────────────────────────────────────
  const riskDist: Record<RiskLevel, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
  STUDENTS.forEach(s => { riskDist[getRiskLevel(computeSubjectPercentage(INITIAL_MARKS, s.id, activeSubject))]++; });

  // ── Below threshold ───────────────────────────────────────────────────────
  const belowThreshold = STUDENTS
    .map(s => ({ ...s, pct: computeSubjectPercentage(INITIAL_MARKS, s.id, activeSubject) }))
    .filter(s => s.pct < 40)
    .sort((a, b) => a.pct - b.pct);

  // ── Full student summary ──────────────────────────────────────────────────
  const studentSummary: StudentSummary[] = STUDENTS.map(s => {
    const pct   = computeSubjectPercentage(INITIAL_MARKS, s.id, activeSubject);
    const risk  = getRiskLevel(pct);
    const marks = ASSESSMENTS.map(a => INITIAL_MARKS[s.id]?.[activeSubject]?.[a.id] ?? null);
    let subOnTime = 0, subLate = 0, subMissing = 0;
    subAssignments.forEach(a => {
      const rec = INITIAL_SUBMISSIONS[a.id]?.[s.id];
      if (!rec || rec.status === 'Not Submitted') subMissing++;
      else if (rec.status === 'Late') subLate++;
      else subOnTime++;
    });
    return { ...s, pct, risk, marks, subOnTime, subLate, subMissing };
  }).sort((a, b) => a.pct - b.pct);

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Performance Analytics" subtitle="Subject-level insights, distributions, and risk overview." />

      <main className="flex-1 p-6 space-y-6 overflow-auto">

        {/* Subject Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
            {SUBJECTS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${activeSubject === s.id ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                {s.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">{subject.code} · Semester 3 · {STUDENTS.length} Students</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Class Average',   value: `${classAvg}%`,       sub: 'Across all assessments',         accent: classAvg >= 60 ? 'text-green-600' : classAvg >= 40 ? 'text-yellow-600' : 'text-red-600' },
            { label: 'Highest Score',   value: `${highest}%`,         sub: 'Top performing student',          accent: 'text-green-600' },
            { label: 'Lowest Score',    value: `${lowest}%`,          sub: 'At-risk student',                 accent: 'text-red-600' },
            { label: 'Submission Rate', value: `${subRate}%`,         sub: `${onTimeCount + lateCount}/${totalSubs} submitted`, accent: subRate >= 75 ? 'text-green-600' : 'text-red-600' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className={`text-2xl font-bold ${c.accent}`}>{c.value}</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Bar — Assessment averages */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Class Average per Assessment</h3>
            <p className="text-xs text-gray-500 mb-4">Average marks scored by the class in each assessment</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={avgPerAssessment} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: number, _name: string, props: { payload?: AssessmentBar }) => {
                    const max = props.payload?.max ?? 0;
                    return [`${value} / ${max} (${max > 0 ? Math.round((value / max) * 100) : 0}%)`, 'Class Avg'];
                  }) as any}
                />
                <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                  {avgPerAssessment.map((entry, i) => (
                    <Cell key={i} fill={entry.pct < 40 ? '#DC2626' : entry.pct < 60 ? '#EA580C' : '#2563EB'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie — Submission rate */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Assignment Submission Rate</h3>
            <p className="text-xs text-gray-500 mb-4">{subAssignments.length} assignments · {STUDENTS.length} students</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={45} outerRadius={80}
                  dataKey="value" labelLine={false}
                  label={renderPieLabel}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Distribution Histogram */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Score Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Number of students scoring in each performance band (0–100%)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={bins} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: number) => [value, 'Students']) as any}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {bins.map((b, i) => (
                  <Cell key={i} fill={b.low < 40 ? '#DC2626' : b.low < 60 ? '#EA580C' : b.low < 75 ? '#CA8A04' : '#16A34A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {([['#DC2626','0–40 Critical'],['#EA580C','40–60 High'],['#CA8A04','60–75 Medium'],['#16A34A','75+ Low Risk']] as [string, string][]).map(([c, l]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-3 h-2 rounded shrink-0" style={{ backgroundColor: c }} />{l}
              </span>
            ))}
          </div>
        </div>

        {/* Risk Distribution + Below Threshold */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              {(Object.entries(riskDist) as [RiskLevel, number][]).map(([level, count]) => {
                const p = Math.round((count / STUDENTS.length) * 100);
                return (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{level}</span>
                      <span className="text-gray-500">{count} ({p}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full" style={{ width: `${p}%`, backgroundColor: RISK_COLORS[level] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Students Below Passing Threshold (&lt;40%)</h3>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold border border-red-200">{belowThreshold.length} students</span>
            </div>
            {belowThreshold.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-400">
                🎉 All students are above the passing threshold in this subject.
              </div>
            ) : (
              <div className="overflow-auto max-h-52">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Student</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Batch</th>
                      {ASSESSMENTS.map(a => <th key={a.id} className="px-3 py-2 text-left font-semibold text-gray-500">{a.label}</th>)}
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Total %</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {belowThreshold.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 bg-red-50/30">
                        <td className="px-4 py-2.5 font-semibold text-gray-800">{s.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{s.batch}</td>
                        {ASSESSMENTS.map(a => {
                          const m   = INITIAL_MARKS[s.id]?.[activeSubject]?.[a.id];
                          const asPct = m != null ? (m / a.maxMarks) * 100 : null;
                          return (
                            <td key={a.id} className={`px-3 py-2.5 font-medium ${asPct != null && asPct < 40 ? 'text-red-600' : 'text-gray-700'}`}>
                              {m ?? '—'}<span className="text-gray-400">/{a.maxMarks}</span>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2.5 font-bold text-red-600">{s.pct}%</td>
                        <td className="px-3 py-2.5"><RiskBadge level={getRiskLevel(s.pct)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Full Class Performance */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Full Class Performance — {subject.name}</h3>
            <span className="text-xs text-gray-400">Sorted by performance (lowest first)</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Student</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Batch</th>
                  {ASSESSMENTS.map(a => <th key={a.id} className="px-3 py-2.5 text-left font-semibold text-gray-500">{a.label} <span className="font-normal text-gray-400">/{a.maxMarks}</span></th>)}
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Total %</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Assignments</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Risk</th>
                </tr>
              </thead>
              <tbody>
                {studentSummary.map((s, i) => (
                  <tr key={s.id} className={`border-b border-gray-50 ${s.pct < 40 ? 'bg-red-50/40' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{s.name}</td>
                    <td className="px-3 py-2.5 text-gray-500">{s.batch}</td>
                    {ASSESSMENTS.map((a, j) => {
                      const m     = s.marks[j];
                      const asPct = m != null ? (m / a.maxMarks) * 100 : null;
                      return (
                        <td key={a.id} className={`px-3 py-2.5 font-medium ${asPct != null && asPct < 40 ? 'text-red-600' : 'text-gray-700'}`}>
                          {m ?? <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2.5 font-bold ${s.pct < 40 ? 'text-red-600' : s.pct < 60 ? 'text-orange-600' : s.pct < 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {s.pct}%
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-green-700 font-medium">{s.subOnTime}✓</span>
                        {s.subLate   > 0 && <span className="text-yellow-600">{s.subLate}⏱</span>}
                        {s.subMissing > 0 && <span className="text-red-600">{s.subMissing}✗</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><RiskBadge level={s.risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
