'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchStudentDashboardData, type StudentDashboardData, type StudentSubjectPerformance, toUiRiskLevel } from '@/src/lib/studentDashboardClient';
import { BookOpen, GraduationCap, FileText } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';

const MAX_SOLUTION_FILE_SIZE_BYTES = 15 * 1024 * 1024;

type AssignmentStatus = 'On Time' | 'Late' | 'Missing' | 'Pending';

const STATUS_COLORS: Record<AssignmentStatus, string> = {
  'On Time': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Late: 'bg-amber-50 text-amber-700 border-amber-200',
  Missing: 'bg-red-50 text-red-700 border-red-200',
  Pending: 'bg-gray-50 text-gray-600 border-gray-200',
};

function getSubjectScore(subject: StudentSubjectPerformance): number {
  const weighted = subject.attendance * 0.3 + subject.marksPercent * 0.5 + subject.completionRate * 0.2;
  return Math.round(weighted);
}

function assessmentLabel(type: string): string {
  if (type === 'unit_test_1') return 'Unit Test 1';
  if (type === 'unit_test_2') return 'Unit Test 2';
  if (type === 'midterm') return 'Midterm';
  if (type === 'endterm') return 'Endterm';
  return type;
}

function assignmentStatusLabel(status: string): AssignmentStatus {
  if (status === 'submitted_on_time') return 'On Time';
  if (status === 'submitted_late') return 'Late';
  if (status === 'not_submitted') return 'Missing';
  return 'Pending';
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="app-topbar">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

function SubjectsContent() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams?.get('id') || '';
  const [activeSubjectId, setActiveSubjectId] = useState(initialSubject);
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState('');
  const [pendingUploadAssignmentId, setPendingUploadAssignmentId] = useState('');
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadSubjects() {
      const result = await fetchStudentDashboardData();
      if (result.ok) {
        setData(result.data);
        setError('');
        setActiveSubjectId((current) => {
          if (current) return current;
          if (initialSubject) return initialSubject;
          return result.data.subjectPerformance[0]?.subjectId || '';
        });
      } else {
        setError(result.message);
      }
      setLoading(false);
    }

    void loadSubjects();
  }, [initialSubject]);

  const subjects = data?.subjectPerformance || [];
  const activeSubject = subjects.find((subject) => subject.subjectId === activeSubjectId) || subjects[0];

  const details = useMemo(() => {
    if (!activeSubject) return null;

    const score = getSubjectScore(activeSubject);
    const riskLevel = toUiRiskLevel(activeSubject.marksPercent < 40 || activeSubject.attendance < 60 ? 'high' : activeSubject.marksPercent < 55 || activeSubject.attendance < 75 ? 'medium' : 'low');

    return {
      ...activeSubject,
      score,
      riskLevel,
      summary:
        riskLevel === 'High'
          ? 'This subject needs immediate attention. Improve attendance and assignment completion first.'
          : riskLevel === 'Medium'
          ? 'This subject is stable but has warning signs. Consistent effort can quickly improve outcomes.'
          : 'Performance in this subject is currently healthy. Maintain consistency to keep this level.',
    };
  }, [activeSubject]);

  async function handleSubmitAssignment(assignmentId: string, file: File) {
    if (!assignmentId || !file) return;

    const allowedMimeTypes = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    if (!allowedMimeTypes.has(file.type) && !allowedExtensions.includes(extension)) {
      setError('Only PDF, DOC, and DOCX files are allowed.');
      return;
    }

    if (file.size > MAX_SOLUTION_FILE_SIZE_BYTES) {
      setError('Solution file must be 15MB or smaller.');
      return;
    }

    setSubmittingAssignmentId(assignmentId);
    setError('');
    setNotice('');

    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('file', file);

      const response = await fetch('/api/student/assignments/submit', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();
      if (!response.ok || !json?.success) {
        setError(json?.message || 'Failed to submit assignment.');
        return;
      }

      const refreshed = await fetchStudentDashboardData();
      if (refreshed.ok) {
        setData(refreshed.data);
      }

      setNotice(json?.message || 'Assignment submitted successfully.');
    } catch {
      setError('Failed to submit assignment.');
    } finally {
      setSubmittingAssignmentId('');
      setPendingUploadAssignmentId('');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
    }
  }

  function openSolutionPicker(assignmentId: string) {
    if (!assignmentId || submittingAssignmentId) return;
    setPendingUploadAssignmentId(assignmentId);
    setError('');
    setNotice('');
    uploadInputRef.current?.click();
  }

  function handleSolutionSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !pendingUploadAssignmentId) {
      setPendingUploadAssignmentId('');
      if (uploadInputRef.current) {
        uploadInputRef.current.value = '';
      }
      return;
    }

    void handleSubmitAssignment(pendingUploadAssignmentId, file);
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Topbar title="Subject Performance" subtitle="Detailed breakdown of your academic progress by subject" />
        <div className="flex flex-1 items-center justify-center text-sm font-medium text-gray-500">Loading subject details...</div>
      </div>
    );
  }

  if (!data || !details) {
    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Topbar title="Subject Performance" subtitle="Detailed breakdown of your academic progress by subject" />
        <div className="flex flex-1 items-center justify-center text-center px-8">
          <div>
            <p className="text-sm font-bold text-gray-900">Subject data unavailable</p>
            <p className="text-xs text-gray-500 mt-1">{error || 'Please refresh to retry.'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <Topbar title="Subject Performance" subtitle="Detailed breakdown of your academic progress by subject" />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Subject List */}
        <div className="w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 shrink-0">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enrolled Subjects ({subjects.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {subjects.map((subject) => {
              const isActive = subject.subjectId === activeSubjectId;
              return (
                <button
                  key={subject.subjectId}
                  onClick={() => setActiveSubjectId(subject.subjectId)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-bold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{subject.name}</h3>
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 mb-4">{subject.faculty}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-400"/> {subject.marksPercent}% marks</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gray-400"/> {subject.completionRate}% tasks</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Subject Details */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8 max-w-5xl mx-auto space-y-8">
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
            
            {/* Header / Summary */}
            <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between bg-linear-to-br from-white to-gray-50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{details.name}</h2>
                <p className="text-sm font-medium text-gray-500 mt-1 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4"/> Taught by {details.faculty}
                </p>
                <div className="mt-4 p-3 bg-gray-100 rounded-lg max-w-xl text-sm font-medium text-gray-700 leading-relaxed">
                  {details.summary}
                </div>
              </div>
              <div className="text-center">
                <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${details.riskLevel === 'High' ? 'border-orange-500 text-orange-600' : 'border-emerald-500 text-emerald-600'}`}>
                  <span className="text-2xl font-black">{details.score}<span className="text-xs font-bold text-gray-400 ml-1">/100</span></span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3">Subject Score</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Assessments Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Internal Assessments</h3>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assessment</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {details.assessments.map((assessment, i) => {
                        const isLow = (assessment.marksObtained / assessment.maxMarks) < 0.4;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">{assessmentLabel(assessment.type)}</td>
                            <td className="px-4 py-4 text-xs font-medium text-gray-500" suppressHydrationWarning>{new Date(assessment.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-4 py-4 text-sm font-black text-right">
                              <span className={isLow ? 'text-red-600' : 'text-gray-900'}>{assessment.marksObtained}</span>
                              <span className="text-gray-400 font-bold ml-1">/ {assessment.maxMarks}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assignments Table */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Assignments Status</h3>
                </div>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleSolutionSelected}
                />
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignment</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brief</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Solution</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {details.assignments.map((assignment, i) => {
                        const status = assignmentStatusLabel(assignment.status);
                        const statusColor = STATUS_COLORS[status] || STATUS_COLORS.Pending;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <p className="text-sm font-bold text-gray-900">{assignment.title}</p>
                              <p className="text-xs font-medium text-gray-500 mt-0.5" suppressHydrationWarning>Due {new Date(assignment.dueDate).toLocaleDateString('en-GB')}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {assignment.assignmentFileUrl ? (
                                <a
                                  href={assignment.assignmentFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                                >
                                  {assignment.assignmentFileName ? 'View File' : 'Open'}
                                </a>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-400">No file</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => openSolutionPicker(assignment.assignmentId)}
                                disabled={submittingAssignmentId === assignment.assignmentId}
                                className="inline-flex rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700 hover:bg-orange-100 disabled:opacity-60"
                              >
                                {submittingAssignmentId === assignment.assignmentId
                                  ? 'Uploading...'
                                  : assignment.status === 'not_submitted'
                                    ? 'Upload'
                                    : 'Resubmit'}
                              </button>
                            </td>
                            <td className="px-4 py-4 text-sm font-black text-right text-gray-900">
                              {assignment.marksObtained ?? '--'}<span className="text-gray-400 font-bold ml-1">/ {assignment.maxMarks}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function SubjectsFallback() {
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <Topbar title="Subject Performance" subtitle="Detailed breakdown of your academic progress by subject" />
      <div className="flex flex-1 items-center justify-center text-sm font-medium text-gray-500">Loading subject details...</div>
    </div>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectsFallback />}>
      <SubjectsContent />
    </Suspense>
  );
}

