'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';

interface InterventionRecord {
  id: string;
  studentId: string;
  studentName: string;
  facultyName: string;
  type: string;
  date: string;
  scoreBefore: number;
  scoreAfter: number;
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

export default function InterventionMonitoring() {
  const [interventions, setInterventions] = useState<InterventionRecord[]>([]);
  const [metrics, setMetrics] = useState({
    totalInterventions: 0,
    improvedCases: 0,
    avgImprovement: 0,
  });
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadInterventions() {
      try {
        const response = await fetch('/api/coordinator/interventions', { cache: 'no-store' });
        const json = await response.json();

        if (!cancelled && response.ok && json?.success && json?.data) {
          setInterventions(
            Array.isArray(json.data.interventions)
              ? (json.data.interventions as InterventionRecord[])
              : []
          );

          setMetrics({
            totalInterventions: Number(json.data.metrics?.totalInterventions) || 0,
            improvedCases: Number(json.data.metrics?.improvedCases) || 0,
            avgImprovement: Number(json.data.metrics?.avgImprovement) || 0,
          });

          setApiError('');
        } else if (!cancelled) {
          setApiError(json?.message || 'Unable to load interventions.');
        }
      } catch {
        if (!cancelled) {
          setApiError('Unable to load interventions.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInterventions();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-hidden">
      <Topbar title="Intervention Tracking" subtitle="Monitor the effectiveness of actions taken by faculty and mentors" />

      <main className="flex-1 flex flex-col p-8 overflow-hidden max-w-6xl mx-auto w-full">
        {loading && (
          <div className="mb-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs font-semibold text-[#1D4ED8]">
            Loading intervention records...
          </div>
        )}
        {apiError && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs font-semibold text-[#B91C1C]">
            {apiError}
          </div>
        )}
        
        {/* Metric Header */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-6 shrink-0">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
             <Activity className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#111827]">
              {metrics.totalInterventions} Logged Interventions
            </h2>
            <p className="text-[13px] font-medium text-[#6B7280] mt-1">
              {metrics.improvedCases} improved cases • Avg improvement {metrics.avgImprovement >= 0 ? '+' : ''}{metrics.avgImprovement} pts
            </p>
          </div>
        </div>

        {/* Interventions Table */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Intervention Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Faculty / Mentor</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Effectiveness (Score)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {interventions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-[#6B7280]">
                      No intervention records found.
                    </td>
                  </tr>
                ) : interventions.map((inv) => {
                  const diff = inv.scoreAfter - inv.scoreBefore;
                  const isPositive = diff > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-[#F9FAFB]/50 transition-colors">
                      <td className="px-6 py-5 text-[13px] font-semibold text-[#111827]">
                        {new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex bg-blue-50 text-[#2563EB] px-3 py-1 rounded-md text-[12px] font-bold border border-blue-100">
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[13px] font-bold text-[#111827]">{inv.studentName}</div>
                        <div className="text-[11px] font-medium text-[#6B7280] mt-0.5">{inv.studentId}</div>
                      </td>
                      <td className="px-6 py-5 text-[13px] font-semibold text-[#111827]">
                        {inv.facultyName}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-0.5">Before</span>
                            <span className="text-[13px] font-semibold text-[#EF4444]">{inv.scoreBefore}</span>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#E5E7EB]" />
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-0.5">After</span>
                            <span className="text-[13px] font-semibold text-[#10B981]">{inv.scoreAfter}</span>
                          </div>
                          <div className={`ml-4 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${isPositive ? 'bg-emerald-50 text-[#10B981]' : 'bg-gray-100 text-[#6B7280]'}`}>
                            {isPositive ? '+' : ''}{diff} pts
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
