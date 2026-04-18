'use client';

import { useState, useRef } from 'react';
import {
  STUDENTS, SUBJECTS, ASSESSMENTS,
  INITIAL_MARKS, computeSubjectPercentage,
  type MarksMap,
} from '@/src/lib/teacherData';

// ─── Topbar (reusable inline) ────────────────────────────────────────────────
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

// ─── Cell Editor ─────────────────────────────────────────────────────────────
function MarksCell({
  value, maxMarks, onChange,
}: { value: number | null; maxMarks: number; onChange: (v: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]   = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  const pct = value != null ? (value / maxMarks) * 100 : null;
  const isLow = pct != null && pct < 40;

  function commit() {
    const num = draft.trim() === '' ? null : Number(draft);
    if (num !== null && (isNaN(num) || num < 0 || num > maxMarks)) {
      setDraft(String(value ?? ''));
    } else {
      onChange(num);
    }
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
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false); } }}
        className="w-16 px-1.5 py-0.5 border border-blue-500 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value ?? '')); setEditing(true); }}
      className={`w-16 text-center px-1.5 py-1 rounded text-xs font-medium transition-colors hover:bg-blue-50 cursor-pointer border border-transparent hover:border-blue-200 ${
        isLow ? 'text-red-600 bg-red-50' : value == null ? 'text-gray-300' : 'text-gray-700'
      }`}
    >
      {value ?? '—'}
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarksEntryPage() {
  const [marks, setMarks]          = useState<MarksMap>(INITIAL_MARKS);
  const [activeSubject, setActive] = useState(SUBJECTS[0].id);
  const [filterBelow, setFilter]   = useState(false);
  const [batchFilter, setBatch]    = useState<'All' | 'CE-A' | 'CE-B'>('All');
  const [saved, setSaved]          = useState(false);
  const [errors, setErrors]        = useState<string[]>([]);

  const subject = SUBJECTS.find(s => s.id === activeSubject)!;

  function updateMark(studentId: string, assessmentId: string, value: number | null) {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [activeSubject]: {
          ...prev[studentId]?.[activeSubject],
          [assessmentId]: value,
        },
      },
    }));
    setSaved(false);
  }

  function handleSave() {
    // Validate: all entered marks within range (already validated in cell, but double-check)
    const errs: string[] = [];
    STUDENTS.forEach(s => {
      ASSESSMENTS.forEach(a => {
        const m = marks[s.id]?.[activeSubject]?.[a.id];
        if (m != null && (m < 0 || m > a.maxMarks)) {
          errs.push(`${s.name} — ${a.label}: ${m} exceeds max ${a.maxMarks}`);
        }
      });
    });
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSaved(true);
    // Simulate API save
    console.log('Saving marks for subject', activeSubject, marks);
    setTimeout(() => setSaved(false), 3000);
  }

  const filteredStudents = STUDENTS.filter(s => {
    const batchOk = batchFilter === 'All' || s.batch === batchFilter;
    const pct = computeSubjectPercentage(marks, s.id, activeSubject);
    const threshOk = !filterBelow || pct < 40;
    return batchOk && threshOk;
  });

  // Compute averages per assessment
  const assessmentAvgs = ASSESSMENTS.map(a => {
    const vals = STUDENTS.map(s => marks[s.id]?.[activeSubject]?.[a.id]).filter(v => v != null) as number[];
    return vals.length ? Math.round(vals.reduce((x, y) => x + y, 0) / vals.length * 10) / 10 : null;
  });

  return (
    <div className="flex flex-col flex-1">
      <Topbar title="Marks Entry" subtitle="Enter internal assessment marks per student. Click any cell to edit." />

      <main className="flex-1 p-6 space-y-4">

        {/* ── Controls ──────────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 flex flex-wrap items-center gap-3">
          {/* Subject tabs */}
          <div className="flex gap-1 border border-gray-200 rounded-md p-0.5 bg-gray-50">
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                onClick={() => { setActive(s.id); setSaved(false); setErrors([]); }}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${activeSubject === s.id ? 'bg-white text-blue-700 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {s.name}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-200" />

          {/* Batch filter */}
          <div className="flex gap-1">
            {(['All', 'CE-A', 'CE-B'] as const).map(b => (
              <button key={b} onClick={() => setBatch(b)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${batchFilter === b ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {b}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
            <input type="checkbox" checked={filterBelow} onChange={e => setFilter(e.target.checked)} className="rounded" />
            Show only below 40%
          </label>

          <div className="ml-auto flex items-center gap-2">
            {/* CSV upload (UI only) */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Bulk CSV Upload
              <input type="file" accept=".csv" className="hidden" onChange={() => alert('CSV import: connect to backend API')} />
            </label>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-semibold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {saved ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Saved
                </>
              ) : 'Save Marks'}
            </button>
          </div>
        </div>

        {/* ── Errors ────────────────────────────────────────────────── */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-red-700 mb-1">Validation Errors — please fix before saving:</p>
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600">• {e}</p>)}
          </div>
        )}

        {/* ── Legend ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />
            Below 40% — needs attention
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
            Click any cell to edit
          </span>
          <span className="text-gray-400">Subject: <strong className="text-gray-700">{subject.name}</strong> ({subject.code}) · Max Total: 100 marks</span>
        </div>

        {/* ── Spreadsheet Table ──────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-auto max-h-[calc(100vh-280px)]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                {/* Header row 1 — subject label */}
                <tr className="bg-blue-600">
                  <th colSpan={2} className="px-4 py-2 text-left text-xs font-semibold text-white">{subject.name} — {subject.code}</th>
                  {ASSESSMENTS.map(a => (
                    <th key={a.id} colSpan={1} className="px-3 py-2 text-center text-xs font-semibold text-blue-100">
                      {a.label}<br /><span className="font-normal text-blue-200">Max: {a.maxMarks}</span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center text-xs font-semibold text-blue-100">Total %</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-blue-100">Status</th>
                </tr>
                {/* Averages row */}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td colSpan={2} className="px-4 py-1.5 text-xs text-gray-500 font-semibold">Class Average</td>
                  {assessmentAvgs.map((avg, i) => (
                    <td key={i} className="px-3 py-1.5 text-xs text-center font-semibold text-blue-700">
                      {avg ?? '—'}
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-xs text-center font-semibold text-blue-700">
                    {Math.round(filteredStudents.reduce((acc, s) => acc + computeSubjectPercentage(marks, s.id, activeSubject), 0) / (filteredStudents.length || 1))}%
                  </td>
                  <td />
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
                  filteredStudents.map((s, idx) => {
                    const pct = computeSubjectPercentage(marks, s.id, activeSubject);
                    const isBelow = pct < 40;
                    return (
                      <tr key={s.id} className={`border-b border-gray-50 ${isBelow ? 'bg-red-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-2.5 w-40">
                          <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.id.toUpperCase()} · {s.batch}</p>
                        </td>
                        <td className="px-3 py-2.5 w-16">
                          <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">{s.batch}</span>
                        </td>
                        {ASSESSMENTS.map(a => (
                          <td key={a.id} className="px-3 py-2.5 text-center">
                            <MarksCell
                              value={marks[s.id]?.[activeSubject]?.[a.id] ?? null}
                              maxMarks={a.maxMarks}
                              onChange={v => updateMark(s.id, a.id, v)}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-xs font-bold ${isBelow ? 'text-red-600' : pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                            {pct}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isBelow ? (
                            <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded px-1.5 py-0.5 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Below Threshold
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded px-1.5 py-0.5 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
          {/* Footer stats */}
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center gap-6 text-xs text-gray-500">
            <span>Showing <strong className="text-gray-700">{filteredStudents.length}</strong> of {STUDENTS.length} students</span>
            <span><strong className="text-red-600">{filteredStudents.filter(s => computeSubjectPercentage(marks, s.id, activeSubject) < 40).length}</strong> below 40% threshold</span>
            <span className="ml-auto text-gray-400">Press Esc to cancel edit · Enter to confirm</span>
          </div>
        </div>

      </main>
    </div>
  );
}
