"use client";

import { useEffect, useState } from "react";
import { Download, FileText, FileSpreadsheet } from "lucide-react";

type RiskDistribution = {
  Low: number;
  Medium: number;
  High: number;
  Critical: number;
};

type DashboardData = {
  total: number;
  atRisk: number;
  riskDist: RiskDistribution;
};

type StudentRecord = {
  id: string;
  name: string;
  department: string;
  classBatch: string;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
};

const EMPTY_DASHBOARD_DATA: DashboardData = {
  total: 0,
  atRisk: 0,
  riskDist: {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  },
};

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-[72px] bg-[#FFFFFF] border-b border-[#E5E7EB] px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-[#111827] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[#6B7280] font-medium mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(EMPTY_DASHBOARD_DATA);
  const [topAtRisk, setTopAtRisk] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardRes, atRiskRes] = await Promise.all([
          fetch("/api/coordinator/dashboard", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/coordinator/at-risk?riskLevel=High,Critical&limit=5", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        if (!dashboardRes.ok || !atRiskRes.ok) {
          throw new Error("Failed to load report data");
        }

        const dashboardJson = (await dashboardRes.json()) as {
          success: boolean;
          data?: DashboardData;
          message?: string;
        };

        const atRiskJson = (await atRiskRes.json()) as {
          success: boolean;
          data?: {
            students: StudentRecord[];
          };
          message?: string;
        };

        if (!dashboardJson.success || !dashboardJson.data) {
          throw new Error(
            dashboardJson.message || "Unable to load dashboard summary",
          );
        }

        if (!atRiskJson.success || !atRiskJson.data) {
          throw new Error(
            atRiskJson.message || "Unable to load at-risk roster",
          );
        }

        setDashboardData(dashboardJson.data);
        setTopAtRisk(atRiskJson.data.students);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load reports";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const { total, atRisk, riskDist } = dashboardData;

  const handleDownloadCSV = async () => {
    try {
      setIsDownloadingCsv(true);

      const response = await fetch("/api/coordinator/export?format=csv", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("CSV export failed");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition");
      const fallbackFileName = `coordinator-report-${new Date().toISOString().slice(0, 10)}.csv`;
      const fileNameMatch = disposition?.match(/filename="?([^\"]+)"?/i);
      const fileName = fileNameMatch?.[1] || fallbackFileName;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export CSV report");
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleDownloadPDF = () => {
    // In a real production app, this would use jspdf or trigger a backend PDF gen.
    // For this client-side demo, we invoke the browser print layout specifically styled for printing.
    window.print();
  };

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-y-auto">
      <Topbar
        title="Generate Reports"
        subtitle="Export analytical breakdown datasets for local offline review"
      />

      <main className="flex-1 p-8 max-w-5xl w-full mx-auto space-y-8 print:p-0">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold print:hidden">
            {error}
          </div>
        )}

        {/* Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-1">
              CSV Raw Data Export
            </h3>
            <p className="text-[13px] text-[#6B7280] font-medium mb-6">
              Download the complete dataset of students and calculated risk
              factors for Excel or Sheets.
            </p>
            <button
              onClick={handleDownloadCSV}
              disabled={isDownloadingCsv}
              className="flex items-center gap-2 bg-[#111827] hover:bg-[#374151] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Download className="w-4 h-4" />{" "}
              {isDownloadingCsv ? "Downloading..." : "Download CSV"}
            </button>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-[#111827] mb-1">
              PDF Summary Report
            </h3>
            <p className="text-[13px] text-[#6B7280] font-medium mb-6">
              Generate a printable summary report highlighting aggregate
              analytics and critical figures.
            </p>
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
            <h2 className="text-2xl font-black text-[#111827]">
              Academic Risk Overview Report
            </h2>
            <p className="text-sm font-semibold text-[#6B7280] mt-1">
              Generated exactly on {new Date().toLocaleDateString("en-GB")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div>
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                Total Checked
              </p>
              <p className="text-2xl font-black text-[#111827]">
                {loading ? "..." : total}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                Total At-Risk
              </p>
              <p className="text-2xl font-black text-[#EF4444]">
                {loading ? "..." : atRisk}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-1">
                Critical Tier
              </p>
              <p className="text-2xl font-black text-[#111827]">
                {loading ? "..." : riskDist.Critical}
              </p>
            </div>
          </div>

          <h3 className="text-sm font-bold text-[#111827] mb-4 uppercase tracking-widest border-b border-[#E5E7EB] pb-2">
            High & Critical Risk Roster (Top 5)
          </h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                <th className="py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Student & ID
                </th>
                <th className="py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                  Dept/Class
                </th>
                <th className="py-3 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">
                  Risk Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {topAtRisk.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-[12px] font-semibold text-[#6B7280]"
                  >
                    No high-risk students found.
                  </td>
                </tr>
              ) : (
                topAtRisk.map((s) => (
                  <tr key={s.id}>
                    <td className="py-4">
                      <p className="text-[13px] font-bold text-[#111827]">
                        {s.name}
                      </p>
                      <p className="text-[11px] font-medium text-[#6B7280]">
                        {s.id}
                      </p>
                    </td>
                    <td className="py-4">
                      <p className="text-[12px] font-semibold text-[#111827]">
                        {s.department}
                      </p>
                      <p className="text-[11px] font-medium text-[#6B7280]">
                        {s.classBatch}
                      </p>
                    </td>
                    <td className="py-4 text-right">
                      <p className="text-[14px] font-black text-[#EF4444]">
                        {s.riskScore}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mt-0.5">
                        {s.riskLevel}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="text-xs font-semibold text-[#6B7280] mt-4 text-center">
            Use CSV Export to view the full list.
          </p>
        </div>
      </main>
    </div>
  );
}
