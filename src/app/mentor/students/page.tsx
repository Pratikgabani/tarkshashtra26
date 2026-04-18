'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const StudentDetailModal = dynamic(() => import('@/src/components/mentor/StudentDetailModal'), { ssr: false });

// ─── Types ────────────────────────────────────────────────

interface StudentRow {
  id: string; name: string; studentId: string; batch: string; semester: number;
  attendance: number; marks: number; riskScore: number; riskLevel: string;
}

// ─── Dummy Data ───────────────────────────────────────────

const DUMMY_STUDENTS: StudentRow[] = [
  { id: '1', name: 'Amit Joshi', studentId: '22CE005', batch: 'CE-A', semester: 3, attendance: 38, marks: 22, riskScore: 82, riskLevel: 'critical' },
  { id: '2', name: 'Pooja Verma', studentId: '22CE010', batch: 'CE-A', semester: 3, attendance: 35, marks: 18, riskScore: 78, riskLevel: 'critical' },
  { id: '3', name: 'Arjun Mehta', studentId: '22CE001', batch: 'CE-A', semester: 3, attendance: 45, marks: 28, riskScore: 68, riskLevel: 'high' },
  { id: '4', name: 'Hinal Bhatt', studentId: '22CE008', batch: 'CE-A', semester: 3, attendance: 50, marks: 32, riskScore: 62, riskLevel: 'high' },
  { id: '5', name: 'Raj Thakkar', studentId: '22CE016', batch: 'CE-B', semester: 3, attendance: 55, marks: 30, riskScore: 58, riskLevel: 'high' },
  { id: '6', name: 'Manish Kumar', studentId: '22CE009', batch: 'CE-A', semester: 3, attendance: 52, marks: 35, riskScore: 55, riskLevel: 'high' },
  { id: '7', name: 'Kavita Rao', studentId: '22CE006', batch: 'CE-A', semester: 3, attendance: 65, marks: 42, riskScore: 45, riskLevel: 'medium' },
  { id: '8', name: 'Nishu Gupta', studentId: '22CE012', batch: 'CE-B', semester: 3, attendance: 72, marks: 48, riskScore: 40, riskLevel: 'medium' },
  { id: '9', name: 'Anisha Reddy', studentId: '22CE019', batch: 'CE-B', semester: 3, attendance: 68, marks: 45, riskScore: 38, riskLevel: 'medium' },
  { id: '10', name: 'Priya Sharma', studentId: '22CE002', batch: 'CE-A', semester: 3, attendance: 88, marks: 72, riskScore: 18, riskLevel: 'low' },
  { id: '11', name: 'Sneha Patel', studentId: '22CE004', batch: 'CE-A', semester: 3, attendance: 95, marks: 85, riskScore: 10, riskLevel: 'low' },
  { id: '12', name: 'Dev Nair', studentId: '22CE007', batch: 'CE-A', semester: 3, attendance: 92, marks: 78, riskScore: 12, riskLevel: 'low' },
];

// ─── Helpers ──────────────────────────────────────────────

const RISK_CFG: Record<string, { bg: string; text: string; dot: string }> = {
  low:      { bg: 'bg-green-50 border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  medium:   { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  high:     { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500' },
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-500' },
};

function riskBadge(level: string) {
  const c = RISK_CFG[level] || RISK_CFG.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} /> {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const stored = localStorage.getItem('shikshasetu_user');
        if (stored) {
          const user = JSON.parse(stored);
          const params = new URLSearchParams({ mentorId: user.id });
          const res = await fetch(`/api/mentor/students?${params}`);
          const json = await res.json();
          if (res.ok && json.data && json.data.length > 0) {
            setStudents(json.data);
            setLoading(false);
            return;
          }
        }
      } catch { /* fallback */ }
      setStudents(DUMMY_STUDENTS);
      setLoading(false);
    }
    load();
  }, []);

  // Check URL for ?view=xxx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('view');
    if (viewId) setSelectedStudentId(viewId);
  }, []);

  // Filters
  let filtered = students;
  if (search.trim()) filtered = filtered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  if (riskFilter !== 'all') filtered = filtered.filter(s => s.riskLevel === riskFilter);
  if (batchFilter !== 'all') filtered = filtered.filter(s => s.batch === batchFilter);

  const batches = [...new Set(students.map(s => s.batch))].filter(Boolean).sort();

  return (
    <div className="flex flex-col flex-1">
      {/* Topbar */}
      <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-[#111827]">Student List</h1>
          <p className="text-xs text-[#6B7280]">All assigned students — filter by risk level, batch, or search</p>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-4">
        {/* Filters */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg px-5 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs text-[#111827] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]" />
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <div className="flex gap-1">
            {['all', 'low', 'medium', 'high', 'critical'].map(r => (
              <button key={r} onClick={() => setRiskFilter(r)}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${riskFilter === r ? 'bg-[#2563EB] text-white' : 'bg-gray-100 text-[#6B7280] hover:bg-gray-200'}`}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
            className="border border-gray-200 rounded px-3 py-1.5 text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#2563EB]">
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#2563EB]" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-xs text-[#6B7280]">No students match the current filters.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280]">Student</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280]">Batch</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280]">Attendance</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280]">Marks</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280]">Risk Score</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280]">Level</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-[#6B7280]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const isHigh = s.riskLevel === 'high' || s.riskLevel === 'critical';
                    return (
                      <tr key={s.id} className={`border-b border-gray-50 ${isHigh ? 'bg-red-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-gray-50`}>
                        <td className="px-4 py-3"><p className="text-xs font-semibold text-[#111827]">{s.name}</p><p className="text-[10px] text-[#6B7280]">{s.studentId}</p></td>
                        <td className="px-3 py-3 text-xs text-[#6B7280]">{s.batch}</td>
                        <td className="px-3 py-3"><span className={`text-xs font-semibold ${s.attendance < 75 ? 'text-red-600' : 'text-[#111827]'}`}>{s.attendance}%</span></td>
                        <td className="px-3 py-3"><span className={`text-xs font-semibold ${s.marks < 40 ? 'text-red-600' : 'text-[#111827]'}`}>{s.marks}%</span></td>
                        <td className="px-3 py-3"><span className={`text-xs font-bold ${s.riskScore >= 75 ? 'text-red-600' : s.riskScore >= 50 ? 'text-orange-600' : s.riskScore >= 25 ? 'text-yellow-600' : 'text-green-600'}`}>{s.riskScore}</span></td>
                        <td className="px-3 py-3">{riskBadge(s.riskLevel)}</td>
                        <td className="px-3 py-3">
                          <button onClick={() => setSelectedStudentId(s.id)}
                            className="px-3 py-1 rounded border border-[#2563EB] text-[11px] font-semibold text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 text-xs text-[#6B7280]">
            Showing <strong className="text-[#111827]">{filtered.length}</strong> of {students.length} students
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
