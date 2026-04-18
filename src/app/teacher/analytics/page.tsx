'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

interface AnalyticsPayload {
  teacher: {
    id: string;
    name: string;
    department: string;
    email: string;
  };
  subjects: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  activeSubjectId: string | null;
  assessments: Array<{
    id: 'ut1' | 'ut2' | 'mid';
    label: string;
    maxMarks: number;
  }>;
  summary: {
    classAverage: number;
    highest: number;
    lowest: number;
    submissionRate: number;
    totalStudents: number;
    totalAssignments: number;
  } | null;
  riskDistribution: Record<RiskLevel, number>;
  assignmentSubmissionBreakdown: {
    onTime: number;
    late: number;
    notSubmitted: number;
  };
  averagesByAssessment: Array<{
    id: string;
    name: string;
    maxMarks: number;
    average: number;
    percentage: number;
  }>;
  histogram: Array<{
    range: string;
    low: number;
    high: number;
    count: number;
  }>;
  belowThresholdStudents: Array<{
    id: string;
    name: string;
    studentId: string;
    batch: string;
    percentage: number;
    risk: RiskLevel;
    marks: Array<{
      assessmentId: string;
      label: string;
      maxMarks: number;
      marks: number | null;
    }>;
  }>;
  studentSummary: Array<{
    id: string;
    name: string;
    studentId: string;
    batch: string;
    percentage: number;
    risk: RiskLevel;
    marks: Array<{
      assessmentId: string;
      label: string;
      maxMarks: number;
      marks: number | null;
    }>;
    assignments: {
      onTime: number;
      late: number;
      notSubmitted: number;
    };
  }>;
}

const PIE_COLORS = ['#16A34A', '#CA8A04', '#DC2626'];

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
    Low: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    High: 'bg-orange-50 text-orange-700 border-orange-200',
    Critical: 'bg-red-50 text-red-700 border-red-200',
  };

  return <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold ${cfg[level]}`}>{level}</span>;
}

export default function TeacherAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const params = new URLSearchParams();
        if (subjectId) {
          params.set('subjectId', subjectId);
        }

        const query = params.toString();
        const response = await fetch(`/api/teacher/analytics${query ? `?${query}` : ''}`, {
          cache: 'no-store',
        });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          const payload = json.data as AnalyticsPayload;
          setData(payload);
          setError('');

          if (payload.activeSubjectId && payload.activeSubjectId !== subjectId) {
            setSubjectId(payload.activeSubjectId);
          }
        } else if (!cancelled) {
          setError(json?.message || 'Failed to load analytics');
          setData(null);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load analytics');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [subjectId]);

  const summary = data?.summary;

  const pieData = useMemo(
    () => [
      { name: 'On Time', value: data?.assignmentSubmissionBreakdown.onTime || 0 },
      { name: 'Late', value: data?.assignmentSubmissionBreakdown.late || 0 },
      { name: 'Not Submitted', value: data?.assignmentSubmissionBreakdown.notSubmitted || 0 },
    ],
    [data]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col flex-1">
        <Topbar title="Performance Analytics" subtitle="Unable to load subject insights" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error || 'Something went wrong while loading analytics.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Performance Analytics" subtitle="Subject-wise performance, risk, and submission insights" />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
            {data.subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSubjectId(subject.id)}
                className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${
                  data.activeSubjectId === subject.id
                    ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>
          {summary && (
            <p className="text-xs text-gray-400">
              {summary.totalStudents} students · {summary.totalAssignments} assignments
            </p>
          )}
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{summary.classAverage}%</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">Class Average</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-green-600">{summary.highest}%</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">Highest Score</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-red-600">{summary.lowest}%</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">Lowest Score</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-2xl font-bold text-blue-600">{summary.submissionRate}%</p>
              <p className="text-xs font-semibold text-gray-700 mt-0.5">Submission Rate</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Class Average per Assessment</h3>
            <p className="text-xs text-gray-500 mb-4">Average marks scored by the class in each assessment</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.averagesByAssessment} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }} />
                <Bar dataKey="average" radius={[4, 4, 0, 0]} fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Assignment Submission Rate</h3>
            <p className="text-xs text-gray-500 mb-4">Current subject submission breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Score Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Number of students in each percentage band</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.histogram} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E5E7EB', borderRadius: 6 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              {(Object.entries(data.riskDistribution) as [RiskLevel, number][]).map(([level, count]) => {
                const pct = summary?.totalStudents ? Math.round((count / summary.totalStudents) * 100) : 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{level}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Students Below Passing Threshold (&lt;40%)</h3>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold border border-red-200">
                {data.belowThresholdStudents.length} students
              </span>
            </div>
            {data.belowThresholdStudents.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-gray-400">
                All students are above threshold for this subject.
              </div>
            ) : (
              <div className="overflow-auto max-h-52">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Student</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-500">Batch</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Total %</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-500">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.belowThresholdStudents.map((student) => (
                      <tr key={student.id} className="border-b border-gray-50 bg-red-50/30">
                        <td className="px-4 py-2.5 font-semibold text-gray-800">{student.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{student.batch}</td>
                        <td className="px-3 py-2.5 font-bold text-red-600">{student.percentage}%</td>
                        <td className="px-3 py-2.5">
                          <RiskBadge level={student.risk} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">Full Class Performance</h3>
            <span className="text-xs text-gray-400">Sorted by percentage (lowest first)</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Student</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Batch</th>
                  {data.assessments.map((assessment) => (
                    <th key={assessment.id} className="px-3 py-2.5 text-left font-semibold text-gray-500">
                      {assessment.label}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Total %</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Assignments</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-gray-500">Risk</th>
                </tr>
              </thead>
              <tbody>
                {data.studentSummary.map((student, index) => (
                  <tr key={student.id} className={`border-b border-gray-50 ${student.percentage < 40 ? 'bg-red-50/40' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{student.name}</td>
                    <td className="px-3 py-2.5 text-gray-500">{student.batch}</td>
                    {student.marks.map((item) => (
                      <td key={item.assessmentId} className="px-3 py-2.5 font-medium text-gray-700">
                        {item.marks ?? '—'}
                      </td>
                    ))}
                    <td className={`px-3 py-2.5 font-bold ${student.percentage < 40 ? 'text-red-600' : 'text-gray-800'}`}>
                      {student.percentage}%
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {student.assignments.onTime} on-time · {student.assignments.late} late · {student.assignments.notSubmitted} missing
                    </td>
                    <td className="px-3 py-2.5">
                      <RiskBadge level={student.risk} />
                    </td>
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
