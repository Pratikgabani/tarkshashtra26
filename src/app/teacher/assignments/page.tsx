'use client';

import { useState } from 'react';
import {
  STUDENTS, SUBJECTS, ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  type Assignment, type SubmissionStatus, type SubmissionsMap,
} from '@/src/lib/teacherData';

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

// ─── Flag Modal ───────────────────────────────────────────────────────────────
function FlagModal({
  studentName, onClose, onSubmit,
}: { studentName: string; onClose: () => void; onSubmit: (note: string) => void }) {
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
            ⚠ This flag will appear on the faculty mentor&apos;s dashboard and trigger a notification.
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Note for Mentor <span className="text-red-500">*</span></label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Student appears disengaged. Multiple assignments not submitted..."
              rows={4}
              maxLength={500}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{note.length}/500</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { if (note.trim()) { onSubmit(note.trim()); onClose(); } }}
            disabled={!note.trim()}
            className="px-4 py-1.5 bg-orange-600 text-white rounded text-xs font-semibold hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit Flag
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Assignment Modal ──────────────────────────────────────────────────
function CreateAssignmentModal({
  onClose, onSave,
}: { onClose: () => void; onSave: (a: Assignment) => void }) {
  const [form, setForm] = useState({
    title: '', description: '', subjectId: SUBJECTS[0].id,
    dueDate: '', maxMarks: 20,
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.title.trim())       { e.title = 'Required'; }
    if (!form.description.trim()) { e.description = 'Required'; }
    if (!form.dueDate)            { e.dueDate = 'Required'; }
    if (form.maxMarks < 1 || form.maxMarks > 100) { e.maxMarks = 'Must be 1–100' as unknown as number; }
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const newA: Assignment = {
      id: 'a' + Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      subjectId: form.subjectId,
      dueDate: form.dueDate,
      maxMarks: form.maxMarks,
    };
    onSave(newA);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Create New Assignment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Implementing AVL Tree"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Subject <span className="text-red-500">*</span></label>
              <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Max Marks <span className="text-red-500">*</span></label>
              <input
                type="number" min={1} max={100} value={form.maxMarks}
                onChange={e => setForm(f => ({ ...f, maxMarks: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
              <input
                type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.dueDate ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.dueDate && <p className="text-xs text-red-500 mt-0.5">{errors.dueDate}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the assignment task..."
                rows={3} maxLength={500}
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-400' : 'border-gray-300'}`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors">Create Assignment</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const [assignments, setAssignments]   = useState<Assignment[]>(ASSIGNMENTS);
  const [submissions, setSubmissions]   = useState<SubmissionsMap>(INITIAL_SUBMISSIONS);
  const [selectedAssignmentId, setSelected] = useState(ASSIGNMENTS[0].id);
  const [subjectFilter, setSubjectFilter]   = useState<string>('All');
  const [statusFilter, setStatusFilter]     = useState<SubmissionStatus | 'All'>('All');
  const [showCreateModal, setShowCreate]    = useState(false);
  const [flagModal, setFlagModal]           = useState<{ studentId: string; name: string } | null>(null);
  const [flags, setFlags]                   = useState<Record<string, string>>({});
  const [saveNotice, setSaveNotice]         = useState('');
  const [bulkStatus, setBulkStatus]         = useState<SubmissionStatus | ''>('');

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId)!;

  const filteredAssignments = assignments.filter(a =>
    subjectFilter === 'All' || a.subjectId === subjectFilter
  );

  function updateStatus(studentId: string, status: SubmissionStatus) {
    setSubmissions(prev => ({
      ...prev,
      [selectedAssignmentId]: {
        ...prev[selectedAssignmentId],
        [studentId]: {
          ...prev[selectedAssignmentId]?.[studentId],
          status,
          marks: status === 'Not Submitted' ? null : prev[selectedAssignmentId]?.[studentId]?.marks ?? null,
        },
      },
    }));
  }

  function updateMarks(studentId: string, marks: number | null) {
    setSubmissions(prev => ({
      ...prev,
      [selectedAssignmentId]: {
        ...prev[selectedAssignmentId],
        [studentId]: { ...prev[selectedAssignmentId]?.[studentId], marks },
      },
    }));
  }

  function handleBulkUpdate() {
    if (!bulkStatus) return;
    const updated: SubmissionsMap[string] = {};
    STUDENTS.forEach(s => {
      updated[s.id] = {
        status: bulkStatus,
        marks: bulkStatus === 'Not Submitted' ? null : submissions[selectedAssignmentId]?.[s.id]?.marks ?? null,
      };
    });
    setSubmissions(prev => ({ ...prev, [selectedAssignmentId]: updated }));
    setBulkStatus('');
  }

  function handleSave() {
    setSaveNotice('Changes saved successfully.');
    setTimeout(() => setSaveNotice(''), 3000);
  }

  // Stats for selected assignment
  const subRecs = submissions[selectedAssignmentId] ?? {};
  const onTime  = STUDENTS.filter(s => subRecs[s.id]?.status === 'On Time').length;
  const late    = STUDENTS.filter(s => subRecs[s.id]?.status === 'Late').length;
  const missing = STUDENTS.filter(s => !subRecs[s.id] || subRecs[s.id]?.status === 'Not Submitted').length;

  const displayStudents = STUDENTS.filter(s => {
    const rec = subRecs[s.id];
    const status = rec?.status ?? 'Not Submitted';
    return statusFilter === 'All' || status === statusFilter;
  });

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Assignment Management" subtitle="Create assignments, track submissions, and flag students." />

      {showCreateModal && (
        <CreateAssignmentModal
          onClose={() => setShowCreate(false)}
          onSave={a => {
            setAssignments(prev => [...prev, a]);
            setSelected(a.id);
          }}
        />
      )}
      {flagModal && (
        <FlagModal
          studentName={flagModal.name}
          onClose={() => setFlagModal(null)}
          onSubmit={note => setFlags(f => ({ ...f, [flagModal.studentId]: note }))}
        />
      )}

      <main className="flex-1 flex overflow-hidden">
        {/* ── Left: Assignment List ────────────────────────────────── */}
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Assignments</p>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              New
            </button>
          </div>

          {/* Subject filter */}
          <div className="px-4 py-2 border-b border-gray-100">
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="All">All Subjects</option>
              {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filteredAssignments.map(a => {
              const sub = SUBJECTS.find(s => s.id === a.subjectId);
              const recs = submissions[a.id] ?? {};
              const subRate = Math.round((STUDENTS.filter(s => recs[s.id]?.status !== 'Not Submitted' && recs[s.id]).length / STUDENTS.length) * 100);
              const isSelected = a.id === selectedAssignmentId;
              const today = new Date('2026-04-18');
              const overdue = new Date(a.dueDate) < today;

              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'border-l-2 border-l-transparent'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-gray-800 leading-snug">{a.title}</p>
                    {overdue && <span className="shrink-0 text-xs text-red-600 font-semibold">Due</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{sub?.name} · Max {a.maxMarks}pts</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full">
                      <div className="h-1 bg-green-500 rounded-full" style={{ width: `${subRate}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{subRate}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Due: {a.dueDate}</p>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Right: Submission Table ──────────────────────────────── */}
        <div className="flex-1 overflow-auto flex flex-col">
          {selectedAssignment ? (
            <>
              {/* Assignment header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{selectedAssignment.title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedAssignment.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Subject: <strong className="text-gray-700">{SUBJECTS.find(s => s.id === selectedAssignment.subjectId)?.name}</strong></span>
                      <span>Due: <strong className="text-gray-700">{selectedAssignment.dueDate}</strong></span>
                      <span>Max Marks: <strong className="text-gray-700">{selectedAssignment.maxMarks}</strong></span>
                    </div>
                  </div>
                  <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>

                {/* Save notice */}
                {saveNotice && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {saveNotice}
                  </div>
                )}

                {/* Summary bar */}
                <div className="flex gap-4 mt-3">
                  {[
                    { label: 'On Time',       count: onTime,  color: 'text-green-700 bg-green-50 border-green-200' },
                    { label: 'Late',           count: late,    color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                    { label: 'Not Submitted',  count: missing, color: 'text-red-700 bg-red-50 border-red-200' },
                  ].map(b => (
                    <span key={b.label} className={`px-2.5 py-1 rounded border text-xs font-semibold ${b.color}`}>
                      {b.count} {b.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center gap-3">
                <div className="flex gap-1">
                  {(['All', 'On Time', 'Late', 'Not Submitted'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${statusFilter === f ? 'bg-gray-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {f}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Bulk update:</span>
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as SubmissionStatus | '')}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select status...</option>
                    <option>On Time</option><option>Late</option><option>Not Submitted</option>
                  </select>
                  <button onClick={handleBulkUpdate} disabled={!bulkStatus}
                    className="px-3 py-1 bg-gray-700 text-white rounded text-xs font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors">
                    Apply to All
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                    <tr>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500">Student</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Batch</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Marks <span className="text-gray-400 font-normal">/ {selectedAssignment.maxMarks}</span></th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">%</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayStudents.map((s, i) => {
                      const rec = subRecs[s.id] ?? { status: 'Not Submitted' as SubmissionStatus, marks: null };
                      const isFlagged = !!flags[s.id];
                      const pct = rec.marks != null ? Math.round((rec.marks / selectedAssignment.maxMarks) * 100) : null;
                      return (
                        <tr key={s.id} className={`border-b border-gray-50 ${rec.status === 'Not Submitted' ? 'bg-red-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-2">
                              {isFlagged && (
                                <span title={flags[s.id]} className="text-orange-500 text-xs">⚠</span>
                              )}
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.id.toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">{s.batch}</td>
                          <td className="px-4 py-2.5">
                            <select
                              value={rec.status}
                              onChange={e => updateStatus(s.id, e.target.value as SubmissionStatus)}
                              className={`border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer ${
                                rec.status === 'On Time' ? 'border-green-200 text-green-700 bg-green-50' :
                                rec.status === 'Late'    ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                'border-red-200 text-red-700 bg-red-50'
                              }`}
                            >
                              <option>On Time</option>
                              <option>Late</option>
                              <option>Not Submitted</option>
                            </select>
                          </td>
                          <td className="px-4 py-2.5">
                            {rec.status !== 'Not Submitted' ? (
                              <input
                                type="number" min={0} max={selectedAssignment.maxMarks}
                                value={rec.marks ?? ''}
                                onChange={e => {
                                  const v = e.target.value === '' ? null : Number(e.target.value);
                                  if (v === null || (v >= 0 && v <= selectedAssignment.maxMarks)) updateMarks(s.id, v);
                                }}
                                className="w-16 border border-gray-300 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="—"
                              />
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {pct != null ? (
                              <span className={`text-xs font-bold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {isFlagged ? (
                              <span className="text-xs text-orange-600 font-semibold">⚠ Flagged</span>
                            ) : (
                              <button
                                onClick={() => setFlagModal({ studentId: s.id, name: s.name })}
                                className="px-2 py-0.5 border border-orange-200 text-orange-600 rounded text-xs font-medium hover:bg-orange-50 transition-colors"
                              >
                                ⚑ Flag
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
