'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SUBJECT_PERFORMANCE, SUBJECT_DETAILS } from '@/src/lib/studentData';
import { BookOpen, GraduationCap, Clock, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function SubjectsPage() {
  const searchParams = useSearchParams();
  const initialSubject = searchParams?.get('id') || SUBJECT_PERFORMANCE[0].id;
  const [activeSubjectId, setActiveSubjectId] = useState(initialSubject);

  const activeSubject = SUBJECT_PERFORMANCE.find(s => s.id === activeSubjectId) || SUBJECT_PERFORMANCE[0];
  // Normally, fetch SUBJECT_DETAILS[activeSubjectId], using the DS mock for all right now if not DS
  const details = activeSubjectId === 'DS' ? SUBJECT_DETAILS.DS : {
    ...SUBJECT_DETAILS.DS,
    name: activeSubject.name,
    faculty: activeSubject.faculty,
    riskLevel: activeSubject.riskLevel,
    score: activeSubject.marks.obtained * 2.5, // fake calculation
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <Topbar title="Subject Performance" subtitle="Detailed breakdown of your academic progress by subject" />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Subject List */}
        <div className="w-80 border-r border-gray-200 bg-gray-50/50 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 shrink-0">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enrolled Subjects ({SUBJECT_PERFORMANCE.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {SUBJECT_PERFORMANCE.map(s => {
              const isActive = s.id === activeSubjectId;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSubjectId(s.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-sm font-bold ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>{s.name}</h3>
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 mb-4">{s.faculty}</p>
                  
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                    <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-400"/> {s.marks.label}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-gray-400"/> {s.assignments.completed}/{s.assignments.total}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Subject Details */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-8 max-w-5xl mx-auto space-y-8">
            
            {/* Header / Summary */}
            <div className="border border-gray-200 rounded-2xl p-6 flex items-center justify-between bg-gradient-to-br from-white to-gray-50 shadow-sm relative overflow-hidden">
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
                      {details.assessments.map((a, i) => {
                        const isLow = (a.obtained / a.max) < 0.4;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-4 text-sm font-bold text-gray-900">{a.name}</td>
                            <td className="px-4 py-4 text-xs font-medium text-gray-500" suppressHydrationWarning>{new Date(a.date).toLocaleDateString('en-GB')}</td>
                            <td className="px-4 py-4 text-sm font-black text-right">
                              <span className={isLow ? 'text-red-600' : 'text-gray-900'}>{a.obtained}</span>
                              <span className="text-gray-400 font-bold ml-1">/ {a.max}</span>
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
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Assignment</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Marks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {details.assignments.map((a, i) => {
                        const statusColors: any = {
                          'On Time': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          'Late': 'bg-amber-50 text-amber-700 border-amber-200',
                          'Missing': 'bg-red-50 text-red-700 border-red-200',
                          'Pending': 'bg-gray-50 text-gray-600 border-gray-200',
                        };
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <p className="text-sm font-bold text-gray-900">{a.name}</p>
                              <p className="text-xs font-medium text-gray-500 mt-0.5" suppressHydrationWarning>Due {new Date(a.dueDate).toLocaleDateString('en-GB')}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusColors[a.status]}`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-black text-right text-gray-900">
                              {a.marks ?? '--'}<span className="text-gray-400 font-bold ml-1">/ {a.max}</span>
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
