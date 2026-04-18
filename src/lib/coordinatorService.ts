import mongoose from "mongoose";
import User from "@/src/models/user";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import StudentAssignment from "@/src/models/studentAssignment";
import RiskScore from "@/src/models/riskScore";
import Intervention from "@/src/models/intervention";

export type CoordinatorRiskLevel = "Low" | "Medium" | "High" | "Critical";
export type CoordinatorUserRole = "Student" | "Teacher" | "Mentor";

export interface CoordinatorStudentRecord {
  id: string;
  name: string;
  department: string;
  classBatch: string;
  attendance: number;
  avgMarks: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  riskScore: number;
  riskLevel: CoordinatorRiskLevel;
  riskExplanation: string;
  lastRiskCalculatedAt?: string;
}

export interface CoordinatorDepartmentStat {
  department: string;
  total: number;
  atRisk: number;
  riskRate: number;
}

export interface CoordinatorClassStat {
  class: string;
  avgScore: number;
  atRiskCount: number;
}

export interface CoordinatorInterventionRecord {
  id: string;
  studentId: string;
  studentName: string;
  facultyName: string;
  type: string;
  date: string;
  scoreBefore: number;
  scoreAfter: number;
  improvement: number;
}

export interface CoordinatorUserRecord {
  id: string;
  name: string;
  email: string;
  role: CoordinatorUserRole;
  department: string;
  status: "Active" | "Inactive";
  studentId?: string;
  semester?: number;
  batch?: string;
}

export interface StudentFilterOptions {
  search?: string | null;
  department?: string | null;
  classBatch?: string | null;
  riskLevel?: string | null;
  limit?: number | null;
}

const HIGH_RISK_LEVELS: CoordinatorRiskLevel[] = ["High", "Critical"];

function mapRiskLevel(value: string | undefined | null, score?: number): CoordinatorRiskLevel {
  if (!value) {
    return scoreToRiskLevel(score ?? 0);
  }

  const normalized = value.toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "medium") return "Medium";
  if (normalized === "high") return "High";
  if (normalized === "critical") return "Critical";

  return scoreToRiskLevel(score ?? 0);
}

function scoreToRiskLevel(score: number): CoordinatorRiskLevel {
  if (score >= 76) return "Critical";
  if (score >= 51) return "High";
  if (score >= 26) return "Medium";
  return "Low";
}

function mapUserRole(value: string): CoordinatorUserRole {
  if (value === "teacher") return "Teacher";
  if (value === "mentor") return "Mentor";
  return "Student";
}

function scoreColorReason(attendance: number, marks: number, assignmentsRate: number): string {
  const reasons: string[] = [];

  if (attendance < 75) reasons.push("low attendance");
  if (marks < 50) reasons.push("low assessment marks");
  if (assignmentsRate < 70) reasons.push("pending assignments");

  if (reasons.length === 0) {
    return "No immediate risk factors detected";
  }

  if (reasons.length === 1) {
    return `Risk driven by ${reasons[0]}`;
  }

  return `Risk driven by ${reasons.slice(0, 2).join(" and ")}`;
}

function deriveRiskFromMetrics(attendance: number, marks: number, assignmentsRate: number) {
  let score = 0;

  if (attendance < 75) {
    score += Math.min(40, Math.round((75 - attendance) * 1.6));
  }

  if (marks < 50) {
    score += Math.min(35, Math.round((50 - marks) * 1.4));
  }

  if (assignmentsRate < 70) {
    score += Math.min(25, Math.round((70 - assignmentsRate) * 0.9));
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    level: scoreToRiskLevel(score),
    explanation: scoreColorReason(attendance, marks, assignmentsRate),
  };
}

function buildRiskExplanationFromFactors(
  factors: Array<{ label?: string; contribution?: number }> | undefined,
  fallback: string
): string {
  if (!factors || factors.length === 0) {
    return fallback;
  }

  const topLabels = [...factors]
    .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))
    .slice(0, 2)
    .map((item) => item.label)
    .filter((label): label is string => Boolean(label));

  if (topLabels.length === 0) {
    return fallback;
  }

  return `Top risk drivers: ${topLabels.join(", ")}`;
}

function isHighRisk(level: CoordinatorRiskLevel): boolean {
  return HIGH_RISK_LEVELS.includes(level);
}

function toIdString(value: mongoose.Types.ObjectId | string): string {
  if (typeof value === "string") return value;
  return value.toString();
}

export async function getCoordinatorStudentRecords(): Promise<CoordinatorStudentRecord[]> {
  type StudentDoc = {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    department?: string;
    batch?: string;
    semester?: number;
    studentId?: string;
  };

  const students = (await User.find({ role: "student" })
    .select({ _id: 1, fullName: 1, department: 1, batch: 1, semester: 1, studentId: 1 })
    .lean()) as StudentDoc[];

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student._id);

  const [attendanceAgg, marksAgg, assignmentAgg, latestRiskAgg] = await Promise.all([
    Attendance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $group: {
          _id: "$studentId",
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: {
              $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
            },
          },
        },
      },
    ]),
    Assessment.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $group: {
          _id: "$studentId",
          totalObtained: { $sum: "$marksObtained" },
          totalMax: { $sum: "$maxMarks" },
        },
      },
    ]),
    StudentAssignment.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $group: {
          _id: "$studentId",
          totalAssignments: { $sum: 1 },
          submittedAssignments: {
            $sum: {
              $cond: [
                { $in: ["$status", ["submitted_on_time", "submitted_late"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
    RiskScore.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { calculatedAt: -1 } },
      {
        $group: {
          _id: "$studentId",
          score: { $first: "$score" },
          riskLevel: { $first: "$riskLevel" },
          factors: { $first: "$factors" },
          calculatedAt: { $first: "$calculatedAt" },
        },
      },
    ]),
  ]);

  const attendanceMap = new Map<
    string,
    {
      totalClasses: number;
      presentClasses: number;
    }
  >();

  for (const row of attendanceAgg as Array<{ _id: mongoose.Types.ObjectId; totalClasses: number; presentClasses: number }>) {
    attendanceMap.set(toIdString(row._id), {
      totalClasses: row.totalClasses,
      presentClasses: row.presentClasses,
    });
  }

  const marksMap = new Map<string, { totalObtained: number; totalMax: number }>();
  for (const row of marksAgg as Array<{ _id: mongoose.Types.ObjectId; totalObtained: number; totalMax: number }>) {
    marksMap.set(toIdString(row._id), {
      totalObtained: row.totalObtained,
      totalMax: row.totalMax,
    });
  }

  const assignmentMap = new Map<string, { totalAssignments: number; submittedAssignments: number }>();
  for (const row of assignmentAgg as Array<{ _id: mongoose.Types.ObjectId; totalAssignments: number; submittedAssignments: number }>) {
    assignmentMap.set(toIdString(row._id), {
      totalAssignments: row.totalAssignments,
      submittedAssignments: row.submittedAssignments,
    });
  }

  const riskMap = new Map<
    string,
    {
      score: number;
      riskLevel: string;
      factors: Array<{ label?: string; contribution?: number }>;
      calculatedAt?: Date;
    }
  >();

  for (const row of latestRiskAgg as Array<{
    _id: mongoose.Types.ObjectId;
    score: number;
    riskLevel: string;
    factors: Array<{ label?: string; contribution?: number }>;
    calculatedAt?: Date;
  }>) {
    riskMap.set(toIdString(row._id), {
      score: row.score,
      riskLevel: row.riskLevel,
      factors: row.factors,
      calculatedAt: row.calculatedAt,
    });
  }

  return students.map((student) => {
    const key = toIdString(student._id);

    const attendanceData = attendanceMap.get(key);
    const marksData = marksMap.get(key);
    const assignmentData = assignmentMap.get(key);
    const riskData = riskMap.get(key);

    const attendance = attendanceData && attendanceData.totalClasses > 0
      ? Math.round((attendanceData.presentClasses / attendanceData.totalClasses) * 100)
      : 0;

    const avgMarks = marksData && marksData.totalMax > 0
      ? Math.round((marksData.totalObtained / marksData.totalMax) * 100)
      : 0;

    const totalAssignments = assignmentData?.totalAssignments ?? 0;
    const assignmentsCompleted = assignmentData?.submittedAssignments ?? 0;
    const assignmentsRate = totalAssignments > 0
      ? Math.round((assignmentsCompleted / totalAssignments) * 100)
      : 0;

    const derivedRisk = deriveRiskFromMetrics(attendance, avgMarks, assignmentsRate);

    const riskScore = riskData?.score ?? derivedRisk.score;
    const riskLevel = mapRiskLevel(riskData?.riskLevel, riskScore);
    const fallbackExplanation = derivedRisk.explanation;

    return {
      id: student.studentId || key,
      name: student.fullName,
      department: student.department || "Unknown",
      classBatch: student.batch || `Semester ${student.semester ?? "N/A"}`,
      attendance,
      avgMarks,
      assignmentsCompleted,
      totalAssignments,
      riskScore,
      riskLevel,
      riskExplanation: buildRiskExplanationFromFactors(riskData?.factors, fallbackExplanation),
      lastRiskCalculatedAt: riskData?.calculatedAt ? riskData.calculatedAt.toISOString() : undefined,
    };
  });
}

export function filterCoordinatorStudents(
  students: CoordinatorStudentRecord[],
  filters: StudentFilterOptions
): CoordinatorStudentRecord[] {
  const search = filters.search?.trim().toLowerCase();
  const department = filters.department?.trim();
  const classBatch = filters.classBatch?.trim();

  const riskLevels = new Set<CoordinatorRiskLevel>();
  if (filters.riskLevel) {
    for (const level of filters.riskLevel.split(",")) {
      const mapped = mapRiskLevel(level.trim());
      riskLevels.add(mapped);
    }
  }

  let filtered = students.filter((student) => {
    if (search) {
      const searchHit =
        student.name.toLowerCase().includes(search) ||
        student.id.toLowerCase().includes(search);
      if (!searchHit) return false;
    }

    if (department && department !== "All" && student.department !== department) {
      return false;
    }

    if (classBatch && classBatch !== "All" && student.classBatch !== classBatch) {
      return false;
    }

    if (riskLevels.size > 0 && !riskLevels.has(student.riskLevel)) {
      return false;
    }

    return true;
  });

  const parsedLimit =
    typeof filters.limit === "number" && Number.isFinite(filters.limit)
      ? Math.max(0, Math.floor(filters.limit))
      : null;

  if (parsedLimit && parsedLimit > 0) {
    filtered = filtered.slice(0, parsedLimit);
  }

  return filtered;
}

export function getRiskDistribution(students: CoordinatorStudentRecord[]) {
  return students.reduce(
    (acc, student) => {
      acc[student.riskLevel] += 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<CoordinatorRiskLevel, number>
  );
}

export function getDepartmentStats(students: CoordinatorStudentRecord[]): CoordinatorDepartmentStat[] {
  const grouped = new Map<string, { total: number; atRisk: number }>();

  for (const student of students) {
    const current = grouped.get(student.department) ?? { total: 0, atRisk: 0 };
    current.total += 1;
    if (isHighRisk(student.riskLevel)) {
      current.atRisk += 1;
    }
    grouped.set(student.department, current);
  }

  return [...grouped.entries()]
    .map(([department, stats]) => ({
      department,
      total: stats.total,
      atRisk: stats.atRisk,
      riskRate: stats.total === 0 ? 0 : Math.round((stats.atRisk / stats.total) * 100),
    }))
    .sort((a, b) => b.riskRate - a.riskRate);
}

export function getClassStats(students: CoordinatorStudentRecord[]): CoordinatorClassStat[] {
  const grouped = new Map<string, { scoreTotal: number; total: number; atRiskCount: number }>();

  for (const student of students) {
    const current = grouped.get(student.classBatch) ?? {
      scoreTotal: 0,
      total: 0,
      atRiskCount: 0,
    };

    current.scoreTotal += student.riskScore;
    current.total += 1;
    if (isHighRisk(student.riskLevel)) {
      current.atRiskCount += 1;
    }

    grouped.set(student.classBatch, current);
  }

  return [...grouped.entries()]
    .map(([classBatch, stats]) => ({
      class: classBatch,
      avgScore: stats.total > 0 ? Math.round(stats.scoreTotal / stats.total) : 0,
      atRiskCount: stats.atRiskCount,
    }))
    .sort((a, b) => b.atRiskCount - a.atRiskCount);
}

export async function getTrendData(defaultTotal: number, defaultAtRisk: number) {
  const monthAgg = (await RiskScore.aggregate([
    { $sort: { calculatedAt: -1 } },
    {
      $addFields: {
        monthKey: {
          $dateToString: {
            format: "%Y-%m",
            date: "$calculatedAt",
          },
        },
      },
    },
    {
      $group: {
        _id: {
          monthKey: "$monthKey",
          studentId: "$studentId",
        },
        riskLevel: { $first: "$riskLevel" },
      },
    },
    {
      $group: {
        _id: "$_id.monthKey",
        total: { $sum: 1 },
        atRisk: {
          $sum: {
            $cond: [{ $in: ["$riskLevel", ["high", "critical"]] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])) as Array<{ _id: string; total: number; atRisk: number }>;

  const recent = monthAgg.slice(-4).map((row) => {
    const parsedDate = new Date(`${row._id}-01T00:00:00Z`);
    const month = parsedDate.toLocaleDateString("en-US", { month: "short" });
    return {
      month,
      atRisk: row.atRisk,
      total: row.total,
    };
  });

  if (recent.length > 0) {
    return recent;
  }

  // Fallback to synthetic trend when historical snapshots are unavailable.
  const trend = [] as Array<{ month: string; atRisk: number; total: number }>;
  const now = new Date();
  for (let index = 3; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const multiplier = 1 - index * 0.08;
    trend.push({
      month: monthDate.toLocaleDateString("en-US", { month: "short" }),
      atRisk: Math.max(0, Math.round(defaultAtRisk * multiplier)),
      total: defaultTotal,
    });
  }
  return trend;
}

function getPopulatedName(entity: unknown, fallback: string): string {
  if (entity && typeof entity === "object" && "fullName" in entity) {
    const value = entity.fullName;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
}

function getPopulatedStudentId(entity: unknown, fallback: string): string {
  if (entity && typeof entity === "object" && "studentId" in entity) {
    const value = entity.studentId;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
}

export async function getInterventionAnalytics() {
  const interventions = (await Intervention.find({})
    .sort({ date: -1 })
    .populate({ path: "studentId", select: "fullName studentId" })
    .populate({ path: "facultyId", select: "fullName" })
    .lean()) as Array<{
    _id: mongoose.Types.ObjectId;
    studentId: unknown;
    facultyId?: unknown;
    type: string;
    date: Date;
    scoreBefore: number;
    scoreAfter: number;
  }>;

  const records: CoordinatorInterventionRecord[] = interventions.map((entry) => {
    const improvement = Math.round((entry.scoreBefore - entry.scoreAfter) * 10) / 10;

    return {
      id: entry._id.toString(),
      studentId: getPopulatedStudentId(entry.studentId, "N/A"),
      studentName: getPopulatedName(entry.studentId, "Unknown Student"),
      facultyName: getPopulatedName(entry.facultyId, "Unassigned"),
      type: entry.type,
      date: entry.date.toISOString(),
      scoreBefore: entry.scoreBefore,
      scoreAfter: entry.scoreAfter,
      improvement,
    };
  });

  const improvedCount = records.filter((record) => record.improvement > 0).length;
  const improvementRate = records.length > 0
    ? Math.round((improvedCount / records.length) * 100)
    : 0;

  const avgRiskReduction = records.length > 0
    ? Math.round(
        (records.reduce((sum, record) => sum + record.improvement, 0) / records.length) * 10
      ) / 10
    : 0;

  return {
    interventions: records,
    totalInterventions: records.length,
    improvedCount,
    improvementRate,
    avgRiskReduction,
  };
}

export async function getCoordinatorUsers(): Promise<CoordinatorUserRecord[]> {
  type UserDoc = {
    _id: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    role: string;
    department: string;
    isActive?: boolean;
    studentId?: string;
    semester?: number;
    batch?: string;
  };

  const users = (await User.find({ role: { $in: ["student", "teacher", "mentor"] } })
    .select({
      _id: 1,
      fullName: 1,
      email: 1,
      role: 1,
      department: 1,
      isActive: 1,
      studentId: 1,
      semester: 1,
      batch: 1,
    })
    .sort({ createdAt: -1 })
    .lean()) as UserDoc[];

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.fullName,
    email: user.email,
    role: mapUserRole(user.role),
    department: user.department,
    status: user.isActive === false ? "Inactive" : "Active",
    studentId: user.studentId,
    semester: user.semester,
    batch: user.batch,
  }));
}

export function toDbRole(value: string): "student" | "teacher" | "mentor" | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "student") return "student";
  if (normalized === "teacher") return "teacher";
  if (normalized === "mentor") return "mentor";
  return null;
}

function csvEscape(value: string | number | undefined): string {
  const stringValue = value === undefined ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function buildStudentsCsv(students: CoordinatorStudentRecord[]): string {
  const header = [
    "Student ID",
    "Student Name",
    "Department",
    "Class",
    "Attendance %",
    "Average Marks %",
    "Assignments Completed",
    "Total Assignments",
    "Risk Score",
    "Risk Level",
    "Risk Explanation",
    "Last Risk Calculated At",
  ];

  const rows = students.map((student) => [
    csvEscape(student.id),
    csvEscape(student.name),
    csvEscape(student.department),
    csvEscape(student.classBatch),
    csvEscape(student.attendance),
    csvEscape(student.avgMarks),
    csvEscape(student.assignmentsCompleted),
    csvEscape(student.totalAssignments),
    csvEscape(student.riskScore),
    csvEscape(student.riskLevel),
    csvEscape(student.riskExplanation),
    csvEscape(student.lastRiskCalculatedAt),
  ].join(","));

  return [header.join(","), ...rows].join("\n");
}
