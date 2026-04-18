'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface TeacherIdentity {
  id: string;
  name: string;
  department: string;
  email: string;
}

interface TeacherStudent {
  id: string;
  name: string;
  studentId: string;
  batch: string;
}

interface TeacherSubject {
  id: string;
  name: string;
  code: string;
}

interface TeacherAssessment {
  id: 'ut1' | 'ut2' | 'mid';
  label: string;
  maxMarks: number;
}

type TeacherMarksMap = Record<string, Record<string, Record<'ut1' | 'ut2' | 'mid', number | null>>>;

type RiskLevel = 'Low' | 'Medium' | 'High';

interface TeacherDashboardData {
  teacher: TeacherIdentity;
  students: TeacherStudent[];
  subjects: TeacherSubject[];
  assessments: TeacherAssessment[];
  marks: TeacherMarksMap;
  assignments: Array<{
    id: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
  }>;
  submissions: Record<string, Record<string, { status: 'On Time' | 'Late' | 'Not Submitted'; marks: number | null }>>;
  flags: Record<string, { note: string; flaggedAt: string }>;
  summary: {
    totalStudents: number;
    belowThreshold: number;
    submissionRate: number;
    averageMarks: number;
    flaggedStudents: number;
  };
  riskDistribution: Record<RiskLevel, number>;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    subjectId: string;
    dueDate: string;
  }>;
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
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
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${cfg[level]}`}>
      {level}
    </span>
  );
}

function getRiskLevel(percentage: number): RiskLevel {
  if (percentage >= 75) return 'Low';
  if (percentage >= 50) return 'Medium';
  return 'High';
}

function computeSubjectPercentage(
  marks: TeacherMarksMap,
  studentId: string,
  subjectId: string,
  assessments: TeacherAssessment[]
): number {
  const totalMax = assessments.reduce((sum, assessment) => sum + assessment.maxMarks, 0);
  if (totalMax === 0) return 0;

  const obtained = assessments.reduce((sum, assessment) => {
    const value = marks[studentId]?.[subjectId]?.[assessment.id] ?? 0;
    return sum + value;
  }, 0);

  return Math.round((obtained / totalMax) * 100);
}

function formatDueDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch('/api/teacher/dashboard', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          setData(json.data as TeacherDashboardData);
          setError('');
        } else if (!cancelled) {
          setError(json?.message || 'Failed to load dashboard');
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const activeSubject = useMemo(() => {
    if (!data || data.subjects.length === 0) {
      return null;
    }

    return data.subjects.find((subject) => subject.id === activeSubjectId) || data.subjects[0];
  }, [data, activeSubjectId]);

  const rows = useMemo(() => {
    if (!data || !activeSubject) {
      return [];
    }

    return data.students.map((student) => {
      const percentage = computeSubjectPercentage(data.marks, student.id, activeSubject.id, data.assessments);
      const risk = getRiskLevel(percentage);
      const isFlagged = Boolean(data.flags[student.id]);
      const marks = data.marks[student.id]?.[activeSubject.id] || { ut1: null, ut2: null, mid: null };

      return {
        student,
        percentage,
        risk,
        isFlagged,
        marks,
      };
    });
  }, [data, activeSubject]);

  const flaggedRows = useMemo(
    () => rows.filter((row) => row.isFlagged),
    [rows]
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
        <Topbar title="Teacher Dashboard" subtitle="Unable to load dashboard" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error || 'Something went wrong while loading dashboard data.'}
          </div>
        </div>
      </div>
    );
  }

  const subtitle = `Welcome back, ${data.teacher.name} · ${new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Teacher Dashboard" subtitle={subtitle} />

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{data.summary.totalStudents}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Total Students</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{data.summary.belowThreshold}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Below Threshold</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600">{data.summary.submissionRate}%</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Submission Rate</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{data.summary.averageMarks}%</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">Class Average</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Subject Overview</h2>
              <div className="flex gap-1">
                {data.subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setActiveSubjectId(subject.id)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeSubject?.id === subject.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {subject.id}
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
                    {data.assessments.map((assessment) => (
                      <th key={assessment.id} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">
                        {assessment.label}
                        <span className="font-normal text-gray-400"> /{assessment.maxMarks}</span>
                      </th>
                    ))}
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Total %</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Risk</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.student.id} className={`border-b border-gray-50 ${row.percentage < 40 ? 'bg-red-50/40' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-800 text-xs">{row.student.name}</p>
                        <p className="text-xs text-gray-400">{row.student.studentId}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{row.student.batch}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{row.marks.ut1 ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{row.marks.ut2 ?? '—'}</td>
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-700">{row.marks.mid ?? '—'}</td>
                      <td className={`px-3 py-2.5 text-xs font-bold ${row.percentage < 40 ? 'text-red-600' : 'text-gray-800'}`}>
                        {row.percentage}%
                      </td>
                      <td className="px-3 py-2.5"><RiskBadge level={row.risk} /></td>
                      <td className="px-3 py-2.5 text-xs text-orange-700 font-medium">
                        {row.isFlagged ? '⚠ Flagged' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Risk Distribution</h3>
              <div className="space-y-2">
                {(Object.entries(data.riskDistribution) as [RiskLevel, number][]).map(([level, count]) => {
                  const pct = data.summary.totalStudents > 0
                    ? Math.round((count / data.summary.totalStudents) * 100)
                    : 0;

                  return (
                    <div key={level}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{level}</span>
                        <span className="text-gray-500">{count} students ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Flagged Students</h3>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-semibold">
                  {flaggedRows.length}
                </span>
              </div>
              <div className="space-y-3">
                {flaggedRows.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No students flagged</p>
                ) : (
                  flaggedRows.map((row) => (
                    <div key={row.student.id} className="border border-orange-100 bg-orange-50/50 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-orange-500 text-xs">⚠</span>
                        <p className="text-xs font-semibold text-gray-800">{row.student.name}</p>
                        <span className="text-xs text-gray-400 ml-auto">{data.flags[row.student.id].flaggedAt}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {data.flags[row.student.id].note}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Upcoming Deadlines</h3>
              <div className="space-y-2">
                {data.upcomingDeadlines.length === 0 ? (
                  <p className="text-xs text-gray-400">No upcoming deadlines</p>
                ) : (
                  data.upcomingDeadlines.map((assignment) => {
                    const subject = data.subjects.find((item) => item.id === assignment.subjectId);
                    return (
                      <div key={assignment.id} className="text-xs">
                        <p className="font-medium text-gray-800">{assignment.title}</p>
                        <p className="text-gray-400">
                          {subject?.name || assignment.subjectId} · Due {formatDueDate(assignment.dueDate)}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Link href="/teacher/marks" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all">
            <p className="text-sm font-semibold text-gray-900">Enter Marks</p>
            <p className="text-xs text-gray-500 mt-0.5">Single entry and CSV bulk upload</p>
          </Link>
          <Link href="/teacher/assignments" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all">
            <p className="text-sm font-semibold text-gray-900">Manage Assignments</p>
            <p className="text-xs text-gray-500 mt-0.5">Track submitted, late, and missing statuses</p>
          </Link>
          <Link href="/teacher/analytics" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-200 hover:shadow-sm transition-all">
            <p className="text-sm font-semibold text-gray-900">View Analytics</p>
            <p className="text-xs text-gray-500 mt-0.5">Subject-wise and student-wise performance insights</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
