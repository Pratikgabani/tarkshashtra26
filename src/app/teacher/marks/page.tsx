'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type UiAssessmentId = 'ut1' | 'ut2' | 'mid';

interface MarksPageData {
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
    department: string;
  }>;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    department: string;
    semester: number;
  }>;
  assessments: Array<{
    id: UiAssessmentId;
    label: string;
    maxMarks: number;
  }>;
  marks: Record<string, Record<string, Record<UiAssessmentId, number | null>>>;
}

interface MarkUpdate {
  studentId: string;
  subjectId: string;
  assessmentId: UiAssessmentId;
  marks: number | null;
}

interface CreateSubjectInput {
  name: string;
  code: string;
  semester: number;
  maxMarks: number;
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

function AddSubjectModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (payload: CreateSubjectInput) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [semester, setSemester] = useState(3);
  const [maxMarks, setMaxMarks] = useState(100);

  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Add Subject</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={submitting}>
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Data Structures"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Code</label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. CS301"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
              <input
                type="number"
                min={1}
                max={8}
                value={semester}
                onChange={(event) => setSemester(Number(event.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Marks</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxMarks}
                onChange={(event) => setMaxMarks(Number(event.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
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
            onClick={() => {
              onSubmit({
                name: name.trim(),
                code: normalizedCode,
                semester,
                maxMarks,
              });
            }}
            disabled={submitting || !name.trim() || !normalizedCode || semester < 1 || semester > 8 || maxMarks < 1}
            className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Subject'}
          </button>
        </div>
      </div>
    </div>
  );
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function mapHeaderToAssessment(header: string): UiAssessmentId | null {
  const normalized = normalizeHeader(header);
  if (normalized === 'ut1' || normalized === 'unittest1' || normalized === 'unittest1') return 'ut1';
  if (normalized === 'ut2' || normalized === 'unittest2' || normalized === 'unittest2') return 'ut2';
  if (normalized === 'mid' || normalized === 'midterm') return 'mid';
  return null;
}

function looksLikeObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function computeSubjectPercentage(
  marks: Record<string, Record<string, Record<UiAssessmentId, number | null>>>,
  studentId: string,
  subjectId: string,
  assessments: Array<{ id: UiAssessmentId; maxMarks: number }>
): number {
  const totalMax = assessments.reduce((sum, assessment) => sum + assessment.maxMarks, 0);
  if (totalMax === 0) return 0;

  const obtained = assessments.reduce((sum, assessment) => {
    const value = marks[studentId]?.[subjectId]?.[assessment.id] ?? 0;
    return sum + value;
  }, 0);

  return Math.round((obtained / totalMax) * 100);
}

function MarksCell({
  value,
  maxMarks,
  onChange,
}: {
  value: number | null;
  maxMarks: number;
  onChange: (value: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = value === null ? null : (value / maxMarks) * 100;
  const isLow = percentage !== null && percentage < 40;

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      onChange(null);
      setEditing(false);
      return;
    }

    const numeric = Number(trimmed);
    if (Number.isNaN(numeric) || numeric < 0 || numeric > maxMarks) {
      setDraft(value === null ? '' : String(value));
      setEditing(false);
      return;
    }

    onChange(numeric);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        type="number"
        min={0}
        max={maxMarks}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') {
            setDraft(value === null ? '' : String(value));
            setEditing(false);
          }
        }}
        className="w-16 px-1.5 py-0.5 border border-blue-500 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value === null ? '' : String(value));
        setEditing(true);
      }}
      className={`w-16 text-center px-1.5 py-1 rounded text-xs font-medium transition-colors hover:bg-blue-50 border border-transparent hover:border-blue-200 ${
        isLow ? 'text-red-600 bg-red-50' : value === null ? 'text-gray-300' : 'text-gray-700'
      }`}
    >
      {value ?? '—'}
    </button>
  );
}

export default function TeacherMarksPage() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<MarksPageData | null>(null);
  const [editableMarks, setEditableMarks] = useState<MarksPageData['marks']>({});
  const [originalMarks, setOriginalMarks] = useState<MarksPageData['marks']>({});
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [batchFilter, setBatchFilter] = useState<'All' | string>('All');
  const [belowFilter, setBelowFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);

  function applyMarksPayload(payload: MarksPageData) {
    setData(payload);
    setEditableMarks(payload.marks || {});
    setOriginalMarks(payload.marks || {});
    setActiveSubjectId((previous) => {
      if (previous && payload.subjects.some((subject) => subject.id === previous)) {
        return previous;
      }

      return payload.subjects[0]?.id || '';
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function loadMarks() {
      try {
        const response = await fetch('/api/teacher/marks', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          const payload = json.data as MarksPageData;
          applyMarksPayload(payload);
          setError('');
        } else if (!cancelled) {
          setError(json?.message || 'Failed to load marks data');
          setData(null);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load marks data');
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadMarks();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const activeSubject = useMemo(() => {
    if (!data || data.subjects.length === 0) return null;
    return data.subjects.find((subject) => subject.id === activeSubjectId) || data.subjects[0];
  }, [data, activeSubjectId]);

  const filteredStudents = useMemo(() => {
    if (!data || !activeSubject) return [];

    return data.students.filter((student) => {
      const batchMatch = batchFilter === 'All' || student.batch === batchFilter;
      const percentage = computeSubjectPercentage(editableMarks, student.id, activeSubject.id, data.assessments);
      const thresholdMatch = !belowFilter || percentage < 40;
      return batchMatch && thresholdMatch;
    });
  }, [data, activeSubject, editableMarks, batchFilter, belowFilter]);

  const dirtyCount = useMemo(() => {
    if (!data || !activeSubject) return 0;

    let changes = 0;
    for (const student of data.students) {
      for (const assessment of data.assessments) {
        const before = originalMarks[student.id]?.[activeSubject.id]?.[assessment.id] ?? null;
        const after = editableMarks[student.id]?.[activeSubject.id]?.[assessment.id] ?? null;
        if (before !== after) {
          changes += 1;
        }
      }
    }
    return changes;
  }, [data, activeSubject, originalMarks, editableMarks]);

  function updateCell(studentId: string, assessmentId: UiAssessmentId, value: number | null) {
    if (!activeSubject) return;

    setEditableMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [activeSubject.id]: {
          ...prev[studentId]?.[activeSubject.id],
          [assessmentId]: value,
        },
      },
    }));

    setNotice('');
  }

  async function saveChanges() {
    if (!data || !activeSubject) return;

    const updates: MarkUpdate[] = [];

    for (const student of data.students) {
      for (const assessment of data.assessments) {
        const before = originalMarks[student.id]?.[activeSubject.id]?.[assessment.id] ?? null;
        const after = editableMarks[student.id]?.[activeSubject.id]?.[assessment.id] ?? null;

        if (before !== after) {
          updates.push({
            studentId: student.id,
            subjectId: activeSubject.id,
            assessmentId: assessment.id,
            marks: after,
          });
        }
      }
    }

    if (updates.length === 0) {
      setNotice('No changes to save.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/teacher/marks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const json = await response.json();

      if (response.ok && json?.success && json?.data) {
        const payload = json.data as MarksPageData;
        applyMarksPayload(payload);
        setNotice('Marks saved successfully.');
      } else {
        const details = Array.isArray(json?.errors) ? ` ${json.errors.join(' | ')}` : '';
        setError((json?.message || 'Failed to save marks') + details);
      }
    } catch {
      setError('Failed to save marks');
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvUpload(file: File) {
    if (!data) return;

    setUploading(true);
    setError('');
    setNotice('');

    try {
      const content = await file.text();
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        setError('CSV file must contain a header and at least one data row.');
        return;
      }

      const headerCells = splitCsvLine(lines[0]);
      const headerMap = new Map<string, number>();
      headerCells.forEach((header, index) => {
        headerMap.set(normalizeHeader(header), index);
      });

      const studentCol =
        headerMap.get('studentid') ??
        headerMap.get('id') ??
        headerMap.get('enrollment') ??
        headerMap.get('enrolment');

      const subjectCol =
        headerMap.get('subjectid') ??
        headerMap.get('subjectcode') ??
        headerMap.get('subjectname') ??
        headerMap.get('subject') ??
        headerMap.get('code');

      if (typeof studentCol !== 'number') {
        setError('CSV header must include studentId (or id/enrollment).');
        return;
      }

      if (!activeSubject && typeof subjectCol !== 'number') {
        setError('CSV must include subjectId or subjectCode column when no subject is selected.');
        return;
      }

      const assessmentColumns = new Map<UiAssessmentId, number>();
      for (const [raw, index] of headerCells.map((h, i) => [h, i] as const)) {
        const assessmentId = mapHeaderToAssessment(raw);
        if (assessmentId) {
          assessmentColumns.set(assessmentId, index);
        }
      }

      if (assessmentColumns.size === 0) {
        setError('CSV must contain at least one assessment column: ut1, ut2, or mid.');
        return;
      }

      const studentIndex = new Map<string, string>();
      for (const student of data.students) {
        studentIndex.set(student.studentId.toLowerCase(), student.id);
        studentIndex.set(student.id.toLowerCase(), student.id);
      }

      const subjectIndex = new Map<string, string>();
      for (const subject of data.subjects) {
        subjectIndex.set(subject.id.toLowerCase(), subject.id);
        subjectIndex.set(subject.code.toLowerCase(), subject.id);
        subjectIndex.set(subject.name.toLowerCase(), subject.id);
      }

      const updates: MarkUpdate[] = [];
      const rowErrors: string[] = [];

      for (let i = 1; i < lines.length; i += 1) {
        const cells = splitCsvLine(lines[i]);
        const studentKey = (cells[studentCol] || '').trim().toLowerCase();

        if (!studentKey) {
          rowErrors.push(`Row ${i + 1}: missing studentId.`);
          continue;
        }

        const studentId = studentIndex.get(studentKey);
        if (!studentId) {
          rowErrors.push(`Row ${i + 1}: student '${cells[studentCol]}' not found.`);
          continue;
        }

        let subjectId = activeSubject?.id || '';
        if (!subjectId) {
          const rawSubject = typeof subjectCol === 'number' ? (cells[subjectCol] || '').trim() : '';
          if (!rawSubject) {
            rowErrors.push(`Row ${i + 1}: missing subjectId/subjectCode.`);
            continue;
          }

          const normalizedSubject = rawSubject.toLowerCase();
          subjectId = subjectIndex.get(normalizedSubject) || '';

          if (!subjectId && looksLikeObjectId(rawSubject)) {
            subjectId = rawSubject;
          }

          if (!subjectId) {
            rowErrors.push(`Row ${i + 1}: subject '${rawSubject}' not recognized.`);
            continue;
          }
        }

        for (const [assessmentId, columnIndex] of assessmentColumns.entries()) {
          const raw = (cells[columnIndex] || '').trim();
          if (!raw) continue;

          const numeric = Number(raw);
          const assessment = data.assessments.find((item) => item.id === assessmentId);

          if (!assessment) continue;

          if (Number.isNaN(numeric)) {
            rowErrors.push(`Row ${i + 1}: invalid number '${raw}' for ${assessmentId}.`);
            continue;
          }

          if (numeric < 0 || numeric > assessment.maxMarks) {
            rowErrors.push(
              `Row ${i + 1}: ${assessmentId} marks must be between 0 and ${assessment.maxMarks}.`
            );
            continue;
          }

          updates.push({
            studentId,
            subjectId,
            assessmentId,
            marks: numeric,
          });
        }
      }

      if (rowErrors.length > 0) {
        setError(rowErrors.slice(0, 8).join(' '));
        return;
      }

      if (updates.length === 0) {
        setError('No valid rows were found in the CSV file.');
        return;
      }

      const response = await fetch('/api/teacher/marks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const json = await response.json();

      if (response.ok && json?.success && json?.data) {
        const payload = json.data as MarksPageData;
        applyMarksPayload(payload);
        setNotice(`CSV upload completed. ${updates.length} marks updated.`);
      } else {
        setError(json?.message || 'CSV upload failed.');
      }
    } catch {
      setError('CSV upload failed. Please verify file format.');
    } finally {
      setUploading(false);
    }
  }

  function triggerCsvUploadPicker() {
    if (uploading) return;
    setError('');
    csvInputRef.current?.click();
  }

  async function createSubject(payload: CreateSubjectInput) {
    setCreatingSubject(true);
    setError('');
    setNotice('');

    try {
      const response = await fetch('/api/teacher/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await response.json();

      if (!response.ok || !json?.success) {
        setError(json?.message || 'Failed to create subject.');
        return;
      }

      const createdSubjectId = json?.data?.subject?.id as string | undefined;

      const refreshedResponse = await fetch('/api/teacher/marks', { cache: 'no-store' });
      const refreshedJson = await refreshedResponse.json();

      if (refreshedResponse.ok && refreshedJson?.success && refreshedJson?.data) {
        const refreshedPayload = refreshedJson.data as MarksPageData;
        applyMarksPayload(refreshedPayload);
        if (createdSubjectId) {
          setActiveSubjectId(createdSubjectId);
        }

        setShowAddSubjectModal(false);
        setNotice('Subject created successfully.');
      } else {
        setShowAddSubjectModal(false);
        setError('Subject created, but failed to refresh marks data. Please reload the page.');
      }
    } catch {
      setError('Failed to create subject.');
    } finally {
      setCreatingSubject(false);
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
        <Topbar title="Marks Entry" subtitle="Unable to load marks module" />
        <div className="p-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error || 'Something went wrong while loading marks data.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Marks Entry" subtitle="Enter marks, save updates, and use CSV mass upload" />

      {showAddSubjectModal && (
        <AddSubjectModal
          onClose={() => setShowAddSubjectModal(false)}
          onSubmit={(payload) => {
            void createSubject(payload);
          }}
          submitting={creatingSubject}
        />
      )}

      <main className="flex-1 p-6 space-y-4">
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
          <div className="flex items-center gap-2">
            {data.subjects.length > 0 ? (
              <div className="flex gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
                {data.subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setActiveSubjectId(subject.id)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      activeSubject?.id === subject.id
                        ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {subject.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700">
                No subjects added yet
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAddSubjectModal(true)}
              className="px-2.5 py-1.5 rounded border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              + Add Subject
            </button>
          </div>

          <div className="h-5 w-px bg-gray-200" />

          <div className="flex gap-1">
            {['All', ...Array.from(new Set(data.students.map((student) => student.batch)))].map((batch) => (
              <button
                key={batch}
                type="button"
                onClick={() => setBatchFilter(batch)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  batchFilter === batch
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {batch}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={belowFilter}
              onChange={(event) => setBelowFilter(event.target.checked)}
              className="rounded"
            />
            Show only below 40%
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={triggerCsvUploadPicker}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors font-medium disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Bulk CSV Upload'}
            </button>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleCsvUpload(file);
                }
                event.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => {
                void saveChanges();
              }}
              disabled={saving || dirtyCount === 0 || !activeSubject}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Save Marks (${dirtyCount})`}
            </button>
          </div>
        </div>

        {data.subjects.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
            No subjects are currently assigned to your account. Click <strong>Add Subject</strong> to create one,
            then you can enter marks and use CSV upload.
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="text-gray-400">
            Subject: <strong className="text-gray-700">{activeSubject?.name || 'N/A'}</strong>
          </span>
          <span>Showing {filteredStudents.length} students</span>
          <span>
            {filteredStudents.filter((student) => activeSubject && computeSubjectPercentage(editableMarks, student.id, activeSubject.id, data.assessments) < 40).length} below threshold
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-600">
                  <th colSpan={2} className="px-4 py-2 text-left text-xs font-semibold text-white">
                    {activeSubject ? `${activeSubject.name} — ${activeSubject.code}` : 'Subject'}
                  </th>
                  {data.assessments.map((assessment) => (
                    <th key={assessment.id} className="px-3 py-2 text-center text-xs font-semibold text-blue-100">
                      {assessment.label}
                      <br />
                      <span className="font-normal text-blue-200">Max: {assessment.maxMarks}</span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-semibold text-blue-100">Total %</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-blue-100">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-xs text-gray-400">
                      No students match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const percentage = activeSubject
                      ? computeSubjectPercentage(editableMarks, student.id, activeSubject.id, data.assessments)
                      : 0;
                    const isBelow = percentage < 40;

                    return (
                      <tr key={student.id} className={`border-b border-gray-50 ${isBelow ? 'bg-red-50/50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-2.5 w-40">
                          <p className="text-xs font-semibold text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.studentId}</p>
                        </td>
                        <td className="px-3 py-2.5 w-16">
                          <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{student.batch}</span>
                        </td>
                        {data.assessments.map((assessment) => (
                          <td key={assessment.id} className="px-3 py-2.5 text-center">
                            <MarksCell
                              value={activeSubject ? editableMarks[student.id]?.[activeSubject.id]?.[assessment.id] ?? null : null}
                              maxMarks={assessment.maxMarks}
                              onChange={(value) => updateCell(student.id, assessment.id, value)}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs font-bold ${isBelow ? 'text-red-600' : percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                            {percentage}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isBelow ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 font-semibold">
                              Below Threshold
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 font-semibold">
                              Passing
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
