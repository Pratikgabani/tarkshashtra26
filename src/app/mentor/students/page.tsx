'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, Filter, Layers, ChevronRight } from 'lucide-react';

const StudentDetailModal = dynamic(() => import('@/src/components/mentor/StudentDetailModal'), { ssr: false });

// ─── Types ────────────────────────────────────────────────
interface StudentRow { id: string; name: string; studentId: string; batch: string; semester: number; attendance: number; marks: number; riskScore: number; riskLevel: string; }

const RISK_CFG: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium:   { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  high:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

function RiskBadge({ level }: { level: string }) {
  const c = RISK_CFG[level] || RISK_CFG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

// ─── Reusable Topbar ────────────────────────────────────────────────────────
function Topbar({ title, subtitle }: { title: string; subtitle?: string; }) {
  return (
    <div className="app-topbar">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('view');
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/mentor/students', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setStudents(json.data);
          setError('');
          return;
        }
        setError(json?.message || 'Unable to load assigned students.');
      } catch {
        setError('Unable to load assigned students.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  let filtered = students;
  if (search.trim()) filtered = filtered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  if (riskFilter !== 'all') filtered = filtered.filter(s => s.riskLevel === riskFilter);
  if (batchFilter !== 'all') filtered = filtered.filter(s => s.batch === batchFilter);
  const batches = [...new Set(students.map(s => s.batch))].filter(Boolean).sort();

  return (
    <div className="flex flex-col flex-1 bg-gray-50/30">
      <Topbar title="Assigned Students" subtitle="Manage and monitor risk profiles of all assigned students." />

      <main className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-xs font-semibold">
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white border text-sm border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Search by student name or ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          <div className="flex bg-gray-100/50 p-1 rounded-xl w-full sm:w-auto">
            {['all', 'low', 'medium', 'high'].map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${riskFilter === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          <div className="relative w-full sm:w-40 shrink-0">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none">
              <option value="all">All Batches</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden box-border">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200 border-t-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4"><Filter className="w-6 h-6 text-gray-400"/></div>
              <p className="text-gray-900 font-bold">No students found</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Student Profile</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Batch Info</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Metrics</th>
                    <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Risk Analytics</th>
                    <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const isHigh = s.riskLevel === 'high';
                    return (
                      <tr key={s.id} className={`border-b border-gray-100 transition-colors ${isHigh ? 'bg-red-50/20' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${isHigh ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {s.name.split(' ').map(n=>n[0]).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{s.name}</p>
                              <p className="text-[11px] font-medium text-gray-500 mt-0.5">{s.studentId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-bold">{s.batch}</span>
                          <span className="ml-2 text-xs font-medium text-gray-500">Sem {s.semester}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-4">
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Attend</p>
                               <p className={`text-xs font-black ${s.attendance < 75 ? 'text-red-500' : 'text-gray-900'}`}>{s.attendance}%</p>
                            </div>
                            <div>
                               <p className="text-[10px] font-bold text-gray-400 uppercase">Marks</p>
                               <p className={`text-xs font-black ${s.marks < 40 ? 'text-orange-500' : 'text-gray-900'}`}>{s.marks}%</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-4">
                          <RiskBadge level={s.riskLevel} />
                          <div className={`text-xs font-black px-2 py-1 rounded-md ${s.riskScore >= 75 ? 'bg-red-100 text-red-700' : s.riskScore >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{s.riskScore}/100</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => setSelectedStudentId(s.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors box-border">
                            Details <ChevronRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs font-medium text-gray-500">
            <p>Showing <strong className="text-gray-900">{filtered.length}</strong> of {students.length} students</p>
          </div>
        </div>
      </main>

      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => { setSelectedStudentId(null); window.history.replaceState({}, '', '/mentor/students'); }}
        />
      )}
    </div>
  );
}

