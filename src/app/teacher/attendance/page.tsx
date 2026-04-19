'use client';

import { useEffect, useMemo, useState } from 'react';

type AttendanceStatus = 'present' | 'absent' | 'late' | null;

interface AttendancePageData {
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
    department: string;
    semester: number;
    maxMarks: number;
  }>;
  activeSubjectId: string | null;
  attendanceDate: string;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
  rows: Array<{
    studentId: string;
    name: string;
    enrollmentId: string;
    batch: string;
    semester: number;
    status: AttendanceStatus;
  }>;
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="app-topbar">
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function StatusPill({
  active,
  label,
  palette,
  onClick,
}: {
  active: boolean;
  label: string;
  palette: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${active ? palette : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
    >
      {label}
    </button>
  );
}

export default function TeacherAttendancePage() {
  const [data, setData] = useState<AttendancePageData | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [editableStatus, setEditableStatus] = useState<Record<string, AttendanceStatus>>({});
  const [originalStatus, setOriginalStatus] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function applyPayload(payload: AttendancePageData) {
    setData(payload);

    const statusMap = payload.rows.reduce<Record<string, AttendanceStatus>>((acc, row) => {
      acc[row.studentId] = row.status;
      return acc;
    }, {});

    setEditableStatus(statusMap);
    setOriginalStatus(statusMap);

    setSubjectId((prev) => {
      if (prev && payload.subjects.some((subject) => subject.id === prev)) {
        return prev;
      }
      return payload.activeSubjectId || '';
    });

    if (payload.attendanceDate) {
      setAttendanceDate(payload.attendanceDate);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadAttendance() {
      try {
        const query = new URLSearchParams();
        if (subjectId) query.set('subjectId', subjectId);
        if (attendanceDate) query.set('date', attendanceDate);

        const response = await fetch(`/api/teacher/attendance${query.toString() ? `?${query.toString()}` : ''}`, {
          cache: 'no-store',
        });
        const json = await response.json();

        if (cancelled) return;

        if (response.ok && json?.success && json?.data) {
          applyPayload(json.data as AttendancePageData);
          setError('');
        } else {
          setData(null);
          setError(json?.message || 'Failed to load attendance data');
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setError('Failed to load attendance data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadAttendance();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [subjectId, attendanceDate]);

  const dirtyCount = useMemo(() => {
    if (!data) return 0;

    let changes = 0;
    for (const row of data.rows) {
      const before = originalStatus[row.studentId] ?? null;
      const after = editableStatus[row.studentId] ?? null;
      if (before !== after) {
        changes += 1;
      }
    }

    return changes;
  }, [data, originalStatus, editableStatus]);

  async function saveAttendance() {
    if (!data || !data.activeSubjectId) return;

    const updates = data.rows
      .map((row) => {
        const before = originalStatus[row.studentId] ?? null;
        const after = editableStatus[row.studentId] ?? null;
        if (before === after) return null;

        return {
          studentId: row.studentId,
          status: after,
        };
      })
      .filter((item) => item !== null);

    if (updates.length === 0) {
      setNotice('No attendance changes to save.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/teacher/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: data.activeSubjectId,
          date: attendanceDate || data.attendanceDate,
          updates,
        }),
      });
      const json = await response.json();

      if (response.ok && json?.success && json?.data) {
        applyPayload(json.data as AttendancePageData);
        setNotice('Attendance updated successfully.');
      } else {
        const details = Array.isArray(json?.errors) ? ` ${json.errors.join(' | ')}` : '';
        setError((json?.message || 'Failed to update attendance') + details);
      }
    } catch {
      setError('Failed to update attendance');
    } finally {
      setSaving(false);
    }
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
      <div className="flex flex-col flex-1">
        <Topbar title="Attendance" subtitle="Unable to load attendance module" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error || 'Something went wrong while loading attendance data.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Attendance" subtitle="Record daily attendance by subject and date" />

      <main className="flex-1 p-6 space-y-4 overflow-auto">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
            {notice}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 flex flex-wrap items-center gap-3">
          <div className="flex gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
            {data.subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => setSubjectId(subject.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  (subjectId || data.activeSubjectId) === subject.id
                    ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {subject.name}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-200" />

          <label className="text-xs font-semibold text-gray-600">
            Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1.5 text-xs"
          />

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                void saveAttendance();
              }}
              disabled={saving || dirtyCount === 0}
              className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Save Attendance (${dirtyCount})`}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{data.summary.total}</p>
            <p className="text-xs font-semibold text-gray-700">Students</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-green-600">{data.summary.present}</p>
            <p className="text-xs font-semibold text-gray-700">Present</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-600">{data.summary.absent}</p>
            <p className="text-xs font-semibold text-gray-700">Absent</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-600">{data.summary.late}</p>
            <p className="text-xs font-semibold text-gray-700">Late</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-2xl font-bold text-gray-900">{data.summary.unmarked}</p>
            <p className="text-xs font-semibold text-gray-700">Unmarked</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-330px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Student</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Batch</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => {
                  const selected = editableStatus[row.studentId] ?? null;

                  return (
                    <tr key={row.studentId} className={`border-b border-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-2.5">
                        <p className="text-xs font-semibold text-gray-800">{row.name}</p>
                        <p className="text-xs text-gray-400">{row.enrollmentId}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{row.batch}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <StatusPill
                            active={selected === 'present'}
                            label="Present"
                            palette="border-green-200 bg-green-50 text-green-700"
                            onClick={() => {
                              setEditableStatus((prev) => ({ ...prev, [row.studentId]: 'present' }));
                              setNotice('');
                            }}
                          />
                          <StatusPill
                            active={selected === 'absent'}
                            label="Absent"
                            palette="border-red-200 bg-red-50 text-red-700"
                            onClick={() => {
                              setEditableStatus((prev) => ({ ...prev, [row.studentId]: 'absent' }));
                              setNotice('');
                            }}
                          />
                          <StatusPill
                            active={selected === 'late'}
                            label="Late"
                            palette="border-amber-200 bg-amber-50 text-amber-700"
                            onClick={() => {
                              setEditableStatus((prev) => ({ ...prev, [row.studentId]: 'late' }));
                              setNotice('');
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setEditableStatus((prev) => ({ ...prev, [row.studentId]: null }));
                              setNotice('');
                            }}
                            className="px-2.5 py-1 rounded border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {data.rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-xs text-gray-400">
                      No students found for this subject.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

