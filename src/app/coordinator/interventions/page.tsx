'use client';

import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight } from 'lucide-react';

type InterventionRecord = {
  id: string;
  studentId: string;
  studentName: string;
  facultyName: string;
  type: string;
  date: string;
  scoreBefore: number;
  scoreAfter: number;
  improvement: number;
};

type InterventionData = {
  interventions: InterventionRecord[];
  totalInterventions: number;
  improvedCount: number;
  improvementRate: number;
  avgRiskReduction: number;
};

const EMPTY_DATA: InterventionData = {
  interventions: [],
  totalInterventions: 0,
  improvedCount: 0,
  improvementRate: 0,
  avgRiskReduction: 0,
};

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
  const [data, setData] = useState<InterventionData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInterventions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/coordinator/intervention-analytics', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to load intervention analytics');
        }

        const json = (await response.json()) as {
          success: boolean;
          data?: InterventionData;
          message?: string;
        };

        if (!json.success || !json.data) {
          throw new Error(json.message || 'Unable to load interventions');
        }

        setData(json.data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load interventions';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadInterventions();
  }, []);

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-hidden">
      <Topbar title="Intervention Tracking" subtitle="Monitor the effectiveness of actions taken by faculty and mentors" />

      <main className="flex-1 flex flex-col p-8 overflow-hidden max-w-6xl mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold mb-6">
            {error}
          </div>
        )}
        
        {/* Metric Header */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-6 shrink-0">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
             <Activity className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#111827]">
              {loading ? '...' : data.totalInterventions} Logged Interventions
            </h2>
            <p className="text-[13px] font-medium text-[#6B7280] mt-1">
              {loading
                ? 'Loading intervention effectiveness metrics...'
                : `${data.improvementRate}% showed measurable risk reduction (avg ${data.avgRiskReduction} points).`}
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-[#6B7280]">
                      Loading interventions...
                    </td>
                  </tr>
                ) : data.interventions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-[#6B7280]">
                      No interventions recorded yet.
                    </td>
                  </tr>
                ) : data.interventions.map((inv) => {
                  const diff = inv.improvement;
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
