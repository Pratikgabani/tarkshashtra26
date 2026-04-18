"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter } from "lucide-react";

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type StudentRecord = {
  id: string;
  name: string;
  department: string;
  classBatch: string;
  attendance: number;
  avgMarks: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskExplanation: string;
};

type StudentApiResponse = {
  success: boolean;
  data?: {
    students: StudentRecord[];
    total: number;
    meta?: {
      departments?: string[];
      classes?: string[];
    };
  };
  message?: string;
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

function RiskBadge({ level }: { level: RiskLevel }) {
  const cfg = {
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    High: "bg-orange-50 text-orange-700 border-orange-200",
    Critical: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border tracking-wide ${cfg[level]}`}
    >
      {level}
    </span>
  );
}

export default function CoordinatorStudents() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/coordinator/at-risk", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch student monitoring data");
        }

        const json = (await response.json()) as StudentApiResponse;
        if (!json.success || !json.data) {
          throw new Error(json.message || "Unable to load students");
        }

        setStudents(json.data.students);

        if (json.data.meta?.departments) {
          setDepartmentOptions(json.data.meta.departments);
        }

        if (json.data.meta?.classes) {
          setClassOptions(json.data.meta.classes);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load students";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filterDept === "All" || s.department === filterDept;
      const matchClass = filterClass === "All" || s.classBatch === filterClass;
      const matchRisk = filterRisk === "All" || s.riskLevel === filterRisk;
      return matchSearch && matchDept && matchClass && matchRisk;
    });
  }, [students, searchTerm, filterDept, filterClass, filterRisk]);

  return (
    <div className="flex flex-col flex-1 bg-[#F9FAFB] h-full overflow-hidden">
      <Topbar
        title="Student Monitoring"
        subtitle="Search, filter, and review individual student profiles and risk rationales"
      />

      <main className="flex-1 flex flex-col p-8 overflow-hidden max-w-[1600px]">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold mb-6">
            {error}
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#6B7280]" />
            </div>
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[#E5E7EB] rounded-lg text-sm bg-[#F9FAFB] text-[#111827] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow outline-none"
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#6B7280]" />
              <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                Filters:
              </span>
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#111827] py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#111827] py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="All">All Classes</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="border border-[#E5E7EB] rounded-lg text-sm bg-white text-[#111827] py-2 pl-3 pr-8 outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="All">All Risks</option>
              {["Critical", "High", "Medium", "Low"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Academics
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Attendance
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Avg Marks
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                    Risk Explanation Engine
                  </th>
                  <th className="px-5 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm font-medium text-[#6B7280]"
                    >
                      Loading students...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm font-medium text-[#6B7280]"
                    >
                      No students found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      className={`hover:bg-[#F9FAFB]/50 transition-colors ${s.riskLevel === "Critical" ? "bg-red-50/20" : ""}`}
                    >
                      <td className="px-5 py-4">
                        <div className="text-[13px] font-bold text-[#111827]">
                          {s.name}
                        </div>
                        <div className="text-[11px] font-medium text-[#6B7280] mt-0.5">
                          {s.id}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[12px] font-semibold text-[#111827]">
                          {s.department}
                        </div>
                        <div className="text-[11px] font-medium text-[#6B7280] mt-0.5">
                          {s.classBatch}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[13px] font-bold ${s.attendance < 75 ? "text-[#EF4444]" : "text-[#111827]"}`}
                        >
                          {s.attendance}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[13px] font-bold ${s.avgMarks < 40 ? "text-[#EF4444]" : "text-[#111827]"}`}
                        >
                          {s.avgMarks}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[14px] font-black ${s.riskLevel === "Critical" ? "text-[#EF4444]" : s.riskLevel === "High" ? "text-[#F97316]" : s.riskLevel === "Medium" ? "text-[#F59E0B]" : "text-[#10B981]"}`}
                        >
                          {s.riskScore}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <RiskBadge level={s.riskLevel} />
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p
                          className={`text-[11px] font-medium leading-relaxed ${s.riskLevel === "Low" ? "text-[#6B7280]" : "text-[#111827]"}`}
                        >
                          {s.riskExplanation}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="text-[11px] font-bold text-[#2563EB] hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] text-xs font-semibold text-[#6B7280] flex justify-between items-center shrink-0">
            <span>Showing {filteredStudents.length} results</span>
          </div>
        </div>
      </main>
    </div>
  );
}
