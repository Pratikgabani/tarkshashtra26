'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';

type RiskLevel = 'Low' | 'Medium' | 'High';

interface StudentRecord {
  id: string;
  name: string;
  department: string;
  classBatch: string;
  attendance: number;
  avgMarks: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-[72px] bg-[#FFFFFF] border-b border-[#E5E7EB] px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-[#6B7280] font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface ReportsPayload {
  summary: {
    total: number;
    atRisk: number;
    riskDist: {
      Low: number;
      Medium: number;
      High: number;
    };
  };
  students: StudentRecord[];
  topRiskStudents: StudentRecord[];
  generatedAt: string;
}

function csvEscape(value: string | number): string {
  const raw = String(value);
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const printableDate = useMemo(() => {
    const parsed = new Date(data?.generatedAt ?? '');
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toLocaleDateString('en-GB');
    }
    return parsed.toLocaleDateString('en-GB');
  }, [data?.generatedAt]);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        const response = await fetch('/api/coordinator/reports', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          const summary = json.data.summary;
          const students = Array.isArray(json.data.students)
            ? (json.data.students as StudentRecord[])
            : [];
          const topRiskStudents = Array.isArray(json.data.topRiskStudents)
            ? (json.data.topRiskStudents as StudentRecord[])
            : [];

          setData({
            summary: {
              total: Number(summary.total) || 0,
              atRisk: Number(summary.atRisk) || 0,
              riskDist: {
                Low: Number(summary.riskDist?.Low) || 0,
                Medium: Number(summary.riskDist?.Medium) || 0,
                High: Number(summary.riskDist?.High) || 0,
              },
            },
            students,
            topRiskStudents,
            generatedAt: json.data.generatedAt || new Date().toISOString(),
          });

          setApiError('');
        } else if (!cancelled) {
          setApiError(json?.message || 'Unable to load report data.');
        }
      } catch {
        if (!cancelled) {
          setApiError('Unable to load report data.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-y-auto">
        <Topbar title="Generate Reports" subtitle="Export analytical breakdown datasets for local offline review" />
        <main className="flex-1 p-8 max-w-5xl w-full mx-auto">
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C]">
            {apiError || 'Reports data unavailable.'}
          </div>
        </main>
      </div>
    );
  }

  const { summary, students, topRiskStudents } = data;

  const handleDownloadCSV = () => {
    const headers = ['ID,Name,Department,Class,Attendance%,AvgMarks,RiskScore,RiskLevel'];
    const rows = students.map((student) => 
      [
        csvEscape(student.id),
        csvEscape(student.name),
        csvEscape(student.department),
        csvEscape(student.classBatch),
        csvEscape(student.attendance),
        csvEscape(student.avgMarks),
        csvEscape(student.riskScore),
        csvEscape(student.riskLevel as RiskLevel),
      ].join(',')
    );
    const csvContent = headers.concat(rows).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_risk_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    // In a real production app, this would use jspdf or trigger a backend PDF gen.
    // For this client-side demo, we invoke the browser print layout specifically styled for printing.
    window.print();
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-y-auto">
      <Topbar title="Generate Reports" subtitle="Export analytical breakdown datasets for local offline review" />

      <main className="flex-1 p-8 max-w-5xl w-full mx-auto space-y-8 print:p-0">
        {loading && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs font-semibold text-[#1D4ED8] print:hidden">
            Loading reports data...
          </div>
        )}
        {apiError && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C] print:hidden">
            {apiError}
          </div>
        )}
        
        {/* Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-1">CSV Raw Data Export</h3>
            <p className="text-[13px] text-[#6B7280] font-medium mb-6">Download the complete dataset of students and calculated risk factors for Excel or Sheets.</p>
            <button 
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 bg-[#111827] hover:bg-[#374151] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-1">PDF Summary Report</h3>
            <p className="text-[13px] text-[#6B7280] font-medium mb-6">Generate a printable summary report highlighting aggregate analytics and high-risk figures.</p>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#111827] px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF Summary
            </button>
          </div>
        </div>

        {/* Printable View Area */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-10 shadow-sm print:border-none print:shadow-none print:p-0">
           <div className="border-b border-[#E5E7EB] pb-6 mb-8">
             <h2 className="text-2xl font-black text-[#111827]">Academic Risk Overview Report</h2>
             <p className="text-sm font-semibold text-[#6B7280] mt-1">Generated exactly on {printableDate}</p>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
             <div><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Total Checked</p><p className="text-2xl font-black text-[#111827]">{summary.total}</p></div>
             <div><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">Total At-Risk</p><p className="text-2xl font-black text-[#EF4444]">{summary.atRisk}</p></div>
             <div><p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">High-Risk Tier</p><p className="text-2xl font-black text-[#111827]">{summary.riskDist.High}</p></div>
           </div>

           <h3 className="text-sm font-bold text-[#111827] mb-4 uppercase tracking-widest border-b border-[#E5E7EB] pb-2">High Risk Roster (Top 5)</h3>
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-[#E5E7EB]">
                 <th className="py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Student & ID</th>
                 <th className="py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Dept/Class</th>
                 <th className="py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">Risk Score</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-[#E5E7EB]">
               {topRiskStudents.map(s => (
                 <tr key={s.id}>
                   <td className="py-4">
                     <p className="text-[13px] font-bold text-[#111827]">{s.name}</p>
                     <p className="text-[11px] font-medium text-[#6B7280]">{s.id}</p>
                   </td>
                   <td className="py-4">
                     <p className="text-[12px] font-semibold text-[#111827]">{s.department}</p>
                     <p className="text-[11px] font-medium text-[#6B7280]">{s.classBatch}</p>
                   </td>
                   <td className="py-4 text-right">
                     <p className="text-[14px] font-black text-[#EF4444]">{s.riskScore}</p>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-0.5">{s.riskLevel}</p>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           <p className="text-xs font-semibold text-[#6B7280] mt-4 text-center">Use CSV Export to view the full list.</p>
        </div>

      </main>
    </div>
  );
}
