'use client';

import { useEffect, useMemo, useState } from 'react';

type UiSubmissionStatus = 'On Time' | 'Late' | 'Not Submitted';

interface AssignmentsPageData {
  teacher: {
    id: string;
    name: string;
    department: string;
    email: string;
  };
  students: Array<{
    id: string;
    name: string;
    studentId: string;
    batch: string;
    semester: number;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    department: string;
    semester: number;
  }>;
  assignments: Array<{
    id: string;
    subjectId: string;
    title: string;
    description: string;
    dueDate: string;
    maxMarks: number;
    attachmentUrl: string | null;
    attachmentOriginalName: string | null;
    attachmentMimeType: string | null;
  }>;
  submissions: Record<string, Record<string, {
    status: UiSubmissionStatus;
    marks: number | null;
    fileUrl: string | null;
    fileName: string | null;
  }>>;
  flags: Record<string, { note: string; flaggedAt: string }>;
}

interface AssignmentCreateForm {
  title: string;
  description: string;
  subjectId: string;
  dueDate: string;
  maxMarks: number;
  assignmentFile: File | null;
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

function FlagModal({
  studentName,
  onClose,
  onSubmit,
  submitting,
}: {
  studentName: string;
  onClose: () => void;
  onSubmit: (note: string) => void;
  submitting: boolean;
}) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Flag Student for Mentor Attention</h3>
          <p className="text-xs text-gray-500 mt-0.5">Flagging: <strong>{studentName}</strong></p>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-xs text-orange-700">
            This flag creates a mentor alert and appears on mentor dashboard.
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Note for Mentor <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Reason for flag..."
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{note.length}/500</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(note.trim())}
            disabled={submitting || note.trim().length < 5}
            className="px-4 py-1.5 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Flag'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAssignmentModal({
  subjects,
  onClose,
  onSave,
  saving,
}: {
  subjects: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (form: AssignmentCreateForm) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<AssignmentCreateForm>({
    title: '',
    description: '',
    subjectId: subjects[0]?.id || '',
    dueDate: '',
    maxMarks: 20,
    assignmentFile: null,
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Create New Assignment</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Assignment title"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="Assignment description"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment File (PDF)</label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;
                setForm((prev) => ({ ...prev, assignmentFile: nextFile }));
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="mt-1 text-[11px] text-gray-500">Optional. Max size: 15MB.</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
              <select
                value={form.subjectId}
                onChange={(event) => setForm((prev) => ({ ...prev, subjectId: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Marks</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.maxMarks}
                onChange={(event) => setForm((prev) => ({ ...prev, maxMarks: Number(event.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50" disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || !form.title.trim() || !form.subjectId || !form.dueDate || form.maxMarks < 1}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionPreviewModal({
  studentName,
  fileName,
  fileUrl,
  onClose,
}: {
  studentName: string;
  fileName: string | null;
  fileUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Student Submission</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {studentName}
              {fileName ? ` • ${fileName}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 p-4 bg-gray-50">
          <iframe
            src={fileUrl}
            title="Submission Preview"
            className="w-full h-full rounded-lg border border-gray-200 bg-white"
          />
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100"
          >
            Open in New Tab
          </a>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  const [data, setData] = useState<AssignmentsPageData | null>(null);
  const [editableSubmissions, setEditableSubmissions] = useState<AssignmentsPageData['submissions']>({});
  const [originalSubmissions, setOriginalSubmissions] = useState<AssignmentsPageData['submissions']>({});
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | UiSubmissionStatus>('All');
  const [bulkStatus, setBulkStatus] = useState<UiSubmissionStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [flagTarget, setFlagTarget] = useState<{ id: string; name: string } | null>(null);
  const [previewSubmission, setPreviewSubmission] = useState<{
    studentName: string;
    fileName: string | null;
    fileUrl: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAssignments() {
      try {
        const response = await fetch('/api/teacher/assignments', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          const payload = json.data as AssignmentsPageData;
          setData(payload);
          setEditableSubmissions(payload.submissions || {});
          setOriginalSubmissions(payload.submissions || {});
          setError('');
        } else if (!cancelled) {
          setError(json?.message || 'Failed to load assignments');
          setData(null);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load assignments');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadAssignments();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const visibleAssignments = useMemo(() => {
    if (!data) return [];
    return data.assignments.filter((assignment) => subjectFilter === 'All' || assignment.subjectId === subjectFilter);
  }, [data, subjectFilter]);

  const selectedAssignment = useMemo(() => {
    if (!data || visibleAssignments.length === 0) return null;

    return visibleAssignments.find((assignment) => assignment.id === selectedAssignmentId)
      || visibleAssignments[0]
      || null;
  }, [data, visibleAssignments, selectedAssignmentId]);

  const rows = useMemo(() => {
    if (!data || !selectedAssignment) return [];

    return data.students
      .map((student) => {
        const record = editableSubmissions[selectedAssignment.id]?.[student.id] || {
          status: 'Not Submitted' as UiSubmissionStatus,
          marks: null,
          fileUrl: null,
          fileName: null,
        };

        return {
          student,
          status: record.status,
          marks: record.marks,
          fileUrl: record.fileUrl,
          fileName: record.fileName,
          isFlagged: Boolean(data.flags[student.id]),
        };
      })
      .filter((row) => statusFilter === 'All' || row.status === statusFilter);
  }, [data, selectedAssignment, editableSubmissions, statusFilter]);

  const dirtyRowCount = useMemo(() => {
    if (!data || !selectedAssignment) return 0;

    let count = 0;
    for (const student of data.students) {
      const before = originalSubmissions[selectedAssignment.id]?.[student.id] || {
        status: 'Not Submitted' as UiSubmissionStatus,
        marks: null,
        fileUrl: null,
        fileName: null,
      };
      const after = editableSubmissions[selectedAssignment.id]?.[student.id] || {
        status: 'Not Submitted' as UiSubmissionStatus,
        marks: null,
        fileUrl: null,
        fileName: null,
      };

      if (before.status !== after.status || before.marks !== after.marks) {
        count += 1;
      }
    }

    return count;
  }, [data, selectedAssignment, originalSubmissions, editableSubmissions]);

  const summary = useMemo(() => {
    if (!selectedAssignment || !data) {
      return { onTime: 0, late: 0, missing: 0 };
    }

    let onTime = 0;
    let late = 0;
    let missing = 0;

    for (const student of data.students) {
      const status = editableSubmissions[selectedAssignment.id]?.[student.id]?.status || 'Not Submitted';
      if (status === 'On Time') onTime += 1;
      else if (status === 'Late') late += 1;
      else missing += 1;
    }

    return { onTime, late, missing };
  }, [data, selectedAssignment, editableSubmissions]);

  function openSubmissionPreview(row: {
    student: { name: string };
    status: UiSubmissionStatus;
    fileName: string | null;
    fileUrl: string | null;
  }) {
    if (row.status === 'Not Submitted') {
      setError('This assignment is not submitted yet.');
      return;
    }

    if (!row.fileUrl) {
      setError('No uploaded PDF found for this submission. Ask the student to submit again with a PDF.');
      return;
    }

    setError('');
    setPreviewSubmission({
      studentName: row.student.name,
      fileName: row.fileName,
      fileUrl: row.fileUrl,
    });
  }

  function updateRow(studentId: string, patch: Partial<{ status: UiSubmissionStatus; marks: number | null }>) {
    if (!selectedAssignment) return;

    setEditableSubmissions((prev) => ({
      ...prev,
      [selectedAssignment.id]: {
        ...prev[selectedAssignment.id],
        [studentId]: {
            ...(prev[selectedAssignment.id]?.[studentId] || {
              status: 'Not Submitted' as UiSubmissionStatus,
              marks: null,
              fileUrl: null,
              fileName: null,
            }),
            status: patch.status ?? prev[selectedAssignment.id]?.[studentId]?.status ?? 'Not Submitted',
            marks: patch.marks !== undefined ? patch.marks : prev[selectedAssignment.id]?.[studentId]?.marks ?? null,
        },
      },
    }));

    setNotice('');
  }

  async function saveChanges() {
    if (!data || !selectedAssignment) return;

    const updates = data.students
      .map((student) => {
        const before = originalSubmissions[selectedAssignment.id]?.[student.id] || {
          status: 'Not Submitted' as UiSubmissionStatus,
          marks: null,
          fileUrl: null,
          fileName: null,
        };
        const after = editableSubmissions[selectedAssignment.id]?.[student.id] || {
          status: 'Not Submitted' as UiSubmissionStatus,
          marks: null,
          fileUrl: null,
          fileName: null,
        };

        if (before.status === after.status && before.marks === after.marks) {
          return null;
        }

        return {
          assignmentId: selectedAssignment.id,
          studentId: student.id,
          status: after.status,
          marks: after.status === 'Not Submitted' ? null : after.marks,
        };
      })
      .filter((item) => item !== null);

    if (updates.length === 0) {
      setNotice('No submission changes to save.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/teacher/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const json = await response.json();

      if (response.ok && json?.success && json?.data) {
        const payload = json.data as AssignmentsPageData;
        setData(payload);
        setEditableSubmissions(payload.submissions || {});
        setOriginalSubmissions(payload.submissions || {});
        setNotice('Submission updates saved successfully.');
      } else {
        const details = Array.isArray(json?.errors) ? ` ${json.errors.join(' | ')}` : '';
        setError((json?.message || 'Failed to save submission updates') + details);
      }
    } catch {
      setError('Failed to save submission updates');
    } finally {
      setSaving(false);
    }
  }

  async function applyBulkStatus() {
    if (!selectedAssignment || !bulkStatus) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/teacher/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          status: bulkStatus,
          marksBehavior: bulkStatus === 'Not Submitted' ? 'clear' : 'keep',
        }),
      });
      const json = await response.json();

      if (response.ok && json?.success && json?.data) {
        const payload = json.data as AssignmentsPageData;
        setData(payload);
        setEditableSubmissions(payload.submissions || {});
        setOriginalSubmissions(payload.submissions || {});
        setNotice('Bulk status update applied.');
        setBulkStatus('');
      } else {
        setError(json?.message || 'Failed to apply bulk status update');
      }
    } catch {
      setError('Failed to apply bulk status update');
    } finally {
      setSaving(false);
    }
  }

  async function createAssignment(form: AssignmentCreateForm) {
    if (!data) return;

    setCreating(true);
    setError('');

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('subjectId', form.subjectId);
      payload.append('dueDate', form.dueDate);
      payload.append('maxMarks', String(form.maxMarks));

      if (form.assignmentFile) {
        payload.append('assignmentFile', form.assignmentFile);
      }

      const response = await fetch('/api/teacher/assignments', {
        method: 'POST',
        body: payload,
      });

      const responseText = await response.text();
      let json: unknown = null;
      try {
        json = responseText ? JSON.parse(responseText) : null;
      } catch {
        json = null;
      }

      const apiResult = json as {
        success?: boolean;
        message?: string;
        assignmentId?: string;
        data?: AssignmentsPageData;
      } | null;

      if (response.ok && apiResult?.success && apiResult?.data) {
        const payload = apiResult.data as AssignmentsPageData;
        setData(payload);
        setEditableSubmissions(payload.submissions || {});
        setOriginalSubmissions(payload.submissions || {});
        setShowCreateModal(false);

        if (apiResult.assignmentId) {
          setSelectedAssignmentId(String(apiResult.assignmentId));
        }

        setNotice('Assignment created successfully.');
      } else {
        const fallbackMessage = responseText && !responseText.trim().startsWith('<')
          ? responseText
          : 'Failed to create assignment';
        setError(apiResult?.message || fallbackMessage);
      }
    } catch {
      setError('Failed to create assignment');
    } finally {
      setCreating(false);
    }
  }

  async function submitFlag(note: string) {
    if (!flagTarget || note.length < 5) {
      setError('Flag note must be at least 5 characters.');
      return;
    }

    setFlagSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/teacher/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: flagTarget.id,
          note,
        }),
      });
      const json = await response.json();

      if (response.ok && json?.success) {
        setNotice('Student flagged successfully. Mentor dashboard will show this alert.');
        setFlagTarget(null);

        if (json?.data?.flags && data) {
          setData({ ...data, flags: json.data.flags as AssignmentsPageData['flags'] });
        }
      } else {
        setError(json?.message || 'Failed to submit flag');
      }
    } catch {
      setError('Failed to submit flag');
    } finally {
      setFlagSubmitting(false);
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
        <Topbar title="Assignment Management" subtitle="Unable to load assignment module" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error || 'Something went wrong while loading assignment data.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Assignment Management" subtitle="Create assignments, track statuses, and flag students to mentors" />

      {showCreateModal && (
        <CreateAssignmentModal
          subjects={data.subjects.map((subject) => ({ id: subject.id, name: subject.name }))}
          onClose={() => setShowCreateModal(false)}
          onSave={(form) => {
            void createAssignment(form);
          }}
          saving={creating}
        />
      )}

      {flagTarget && (
        <FlagModal
          studentName={flagTarget.name}
          onClose={() => setFlagTarget(null)}
          onSubmit={(note) => {
            void submitFlag(note);
          }}
          submitting={flagSubmitting}
        />
      )}

      {previewSubmission && (
        <SubmissionPreviewModal
          studentName={previewSubmission.studentName}
          fileName={previewSubmission.fileName}
          fileUrl={previewSubmission.fileUrl}
          onClose={() => setPreviewSubmission(null)}
        />
      )}

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Assignments</p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
            >
              New
            </button>
          </div>

          <div className="px-4 py-2 border-b border-gray-100">
            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700"
            >
              <option value="All">All Subjects</option>
              {data.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {visibleAssignments.map((assignment) => {
              const subject = data.subjects.find((item) => item.id === assignment.subjectId);
              const records = editableSubmissions[assignment.id] || {};
              const submitted = data.students.filter((student) => {
                const status = records[student.id]?.status || 'Not Submitted';
                return status !== 'Not Submitted';
              }).length;
              const submissionRate = data.students.length > 0 ? Math.round((submitted / data.students.length) * 100) : 0;
              const selected = selectedAssignment?.id === assignment.id;

              return (
                <button
                  type="button"
                  key={assignment.id}
                  onClick={() => setSelectedAssignmentId(assignment.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selected ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'border-l-2 border-l-transparent'
                  }`}
                >
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{assignment.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{subject?.name || assignment.subjectId} · Max {assignment.maxMarks}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full">
                      <div className="h-1 bg-green-500 rounded-full" style={{ width: `${submissionRate}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{submissionRate}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Due: {assignment.dueDate}</p>
                </button>
              );
            })}

            {visibleAssignments.length === 0 && (
              <div className="p-4 text-xs text-gray-400">No assignments available for this filter.</div>
            )}
          </div>
        </aside>

        <div className="flex-1 overflow-auto flex flex-col">
          {error && (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {notice && (
            <div className="m-4 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700">
              {notice}
            </div>
          )}

          {selectedAssignment ? (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{selectedAssignment.title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedAssignment.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Subject:{' '}
                        <strong className="text-gray-700">
                          {data.subjects.find((subject) => subject.id === selectedAssignment.subjectId)?.name || selectedAssignment.subjectId}
                        </strong>
                      </span>
                      <span>Due: <strong className="text-gray-700">{selectedAssignment.dueDate}</strong></span>
                      <span>Max Marks: <strong className="text-gray-700">{selectedAssignment.maxMarks}</strong></span>
                      {selectedAssignment.attachmentUrl && (
                        <a
                          href={selectedAssignment.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          View Brief{selectedAssignment.attachmentOriginalName ? ` (${selectedAssignment.attachmentOriginalName})` : ''}
                        </a>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void saveChanges();
                    }}
                    disabled={saving || dirtyRowCount === 0}
                    className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : `Save Changes (${dirtyRowCount})`}
                  </button>
                </div>

                <div className="flex gap-4 mt-3">
                  <span className="px-2.5 py-1 rounded border text-xs font-semibold text-green-700 bg-green-50 border-green-200">
                    {summary.onTime} On Time
                  </span>
                  <span className="px-2.5 py-1 rounded border text-xs font-semibold text-yellow-700 bg-yellow-50 border-yellow-200">
                    {summary.late} Late
                  </span>
                  <span className="px-2.5 py-1 rounded border text-xs font-semibold text-red-700 bg-red-50 border-red-200">
                    {summary.missing} Not Submitted
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center gap-3">
                <div className="flex gap-1">
                  {(['All', 'On Time', 'Late', 'Not Submitted'] as const).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setStatusFilter(item)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        statusFilter === item
                          ? 'bg-gray-700 text-white'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Bulk update:</span>
                  <select
                    value={bulkStatus}
                    onChange={(event) => setBulkStatus(event.target.value as UiSubmissionStatus | '')}
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="">Select status...</option>
                    <option value="On Time">On Time</option>
                    <option value="Late">Late</option>
                    <option value="Not Submitted">Not Submitted</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      void applyBulkStatus();
                    }}
                    disabled={saving || !bulkStatus}
                    className="px-3 py-1 bg-gray-700 text-white rounded text-xs font-medium disabled:opacity-40"
                  >
                    Apply to All
                  </button>
                </div>
              </div>

              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Student</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Batch</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Submission</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">
                        Marks <span className="text-gray-400 font-normal">/ {selectedAssignment.maxMarks}</span>
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">%</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const percentage = row.marks !== null
                        ? Math.round((row.marks / selectedAssignment.maxMarks) * 100)
                        : null;

                      return (
                        <tr key={row.student.id} className={`border-b border-gray-50 ${row.status === 'Not Submitted' ? 'bg-red-50/30' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-5 py-2.5">
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{row.student.name}</p>
                              <p className="text-xs text-gray-400">{row.student.studentId}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{row.student.batch}</td>
                          <td className="px-4 py-2.5">
                            <select
                              value={row.status}
                              onChange={(event) => {
                                const next = event.target.value as UiSubmissionStatus;
                                updateRow(row.student.id, {
                                  status: next,
                                  marks: next === 'Not Submitted' ? null : row.marks,
                                });
                              }}
                              className={`border rounded px-2 py-1 text-xs font-medium ${
                                row.status === 'On Time'
                                  ? 'border-green-200 text-green-700 bg-green-50'
                                  : row.status === 'Late'
                                    ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                                    : 'border-red-200 text-red-700 bg-red-50'
                              }`}
                            >
                              <option value="On Time">On Time</option>
                              <option value="Late">Late</option>
                              <option value="Not Submitted">Not Submitted</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-600">
                            <button
                              type="button"
                              onClick={() => openSubmissionPreview(row)}
                              disabled={row.status === 'Not Submitted'}
                              className={`inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold ${
                                row.status === 'Not Submitted'
                                  ? 'border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {row.status === 'Not Submitted' ? 'No Submission' : 'See Submission'}
                            </button>
                          </td>
                          <td className="px-4 py-2.5">
                            {row.status !== 'Not Submitted' ? (
                              <input
                                type="number"
                                min={0}
                                max={selectedAssignment.maxMarks}
                                value={row.marks ?? ''}
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  const next = raw === '' ? null : Number(raw);
                                  if (next === null || (!Number.isNaN(next) && next >= 0 && next <= selectedAssignment.maxMarks)) {
                                    updateRow(row.student.id, { marks: next });
                                  }
                                }}
                                className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs text-center"
                              />
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {percentage !== null ? (
                              <span className={`text-xs font-bold ${percentage >= 70 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {percentage}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {row.isFlagged ? (
                              <span className="text-xs text-orange-600 font-semibold">⚠ Flagged</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setFlagTarget({ id: row.student.id, name: row.student.name })}
                                className="px-2 py-0.5 border border-orange-200 text-orange-600 rounded text-xs font-medium hover:bg-orange-50"
                              >
                                Flag
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">
                          No students match current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
              Select an assignment from the left panel.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

