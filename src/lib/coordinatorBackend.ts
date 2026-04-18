import Assessment from "@/src/models/assessment";
import Attendance from "@/src/models/attendance";
import MentorAction from "@/src/models/mentorAction";
import RiskScore from "@/src/models/riskScore";
import StudentAssignment from "@/src/models/studentAssignment";
import User from "@/src/models/user";

export type CoordinatorRiskLevel = "Low" | "Medium" | "High";

export interface CoordinatorStudentRecord {
  id: string;
  dbId: string;
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
}

export interface CoordinatorDepartmentStat {
  department: string;
  total: number;
  atRisk: number;
  riskRate: number;
}

export interface CoordinatorRiskDistribution {
  Low: number;
  Medium: number;
  High: number;
}

export interface CoordinatorSystemAggregates {
  total: number;
  atRisk: number;
  riskDist: CoordinatorRiskDistribution;
  deptStats: CoordinatorDepartmentStat[];
}

interface LatestRiskDoc {
  studentId: { toString(): string };
  score: number;
  riskLevel: string;
  factors?: Array<{
    factor?: string;
    label?: string;
    contribution?: number;
  }>;
}

function roundPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function mapDbRiskLevel(level: string | undefined): CoordinatorRiskLevel | null {
  switch ((level || "").toLowerCase()) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return null;
  }
}

function riskLevelFromHealthScore(score: number): CoordinatorRiskLevel {
  if (score < 60) return "High";
  if (score < 75) return "Medium";
  return "Low";
}

function predictedDbLevelLowWorse(score: number): string {
  if (score < 60) return "high";
  if (score < 75) return "medium";
  return "low";
}

function predictedDbLevelHighWorse(score: number): string {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  return "high";
}

function normalizeRiskToHealthScore(score: number, riskLevel?: string): number {
  const bounded = Math.max(0, Math.min(100, Math.round(score)));
  const dbLevel = (riskLevel || "").toLowerCase();

  const lowWorseMatches = dbLevel && predictedDbLevelLowWorse(bounded) === dbLevel;
  const highWorseMatches = dbLevel && predictedDbLevelHighWorse(bounded) === dbLevel;

  if (lowWorseMatches && !highWorseMatches) {
    return bounded;
  }
  if (highWorseMatches && !lowWorseMatches) {
    return 100 - bounded;
  }

  // Favor common risk-score semantics in this codebase (higher score = higher risk).
  return 100 - bounded;
}

function calculateHealthScoreFromInputs(
  attendance: number,
  marks: number,
  assignmentCompletionRate: number
): number {
  let score = 100;

  if (attendance < 75) {
    score -= (75 - attendance) * 1.5;
  }
  if (marks < 50) {
    score -= (50 - marks) * 0.8;
  }
  if (assignmentCompletionRate < 80) {
    score -= (80 - assignmentCompletionRate) * 0.5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildRiskExplanation(
  riskLevel: CoordinatorRiskLevel,
  attendance: number,
  marks: number,
  assignmentCompletionRate: number,
  factors?: Array<{ factor?: string; label?: string; contribution?: number }>
): string {
  if (riskLevel === "Low") {
    return "Performing well";
  }

  if (Array.isArray(factors) && factors.length > 0) {
    const topFactors = [...factors]
      .sort((a, b) => (b.contribution || 0) - (a.contribution || 0))
      .slice(0, 2)
      .map((factor) => factor.label || factor.factor)
      .filter((value): value is string => Boolean(value));

    if (topFactors.length > 0) {
      return `Risk due to ${topFactors.join(" and ")}`;
    }
  }

  const reasons: string[] = [];
  if (attendance < 75) reasons.push("low attendance");
  if (marks < 50) reasons.push("low marks");
  if (assignmentCompletionRate < 80) reasons.push("missing assignments");

  if (reasons.length > 0) {
    return `Risk due to ${reasons.join(" and ")}`;
  }

  return "Monitor academic consistency";
}

async function loadLatestRiskMap(studentIds: Array<unknown>): Promise<Map<string, LatestRiskDoc>> {
  if (studentIds.length === 0) {
    return new Map<string, LatestRiskDoc>();
  }

  const latestRisk = (await RiskScore.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    { $sort: { calculatedAt: -1 } },
    { $group: { _id: "$studentId", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
  ])) as LatestRiskDoc[];

  return new Map(latestRisk.map((risk) => [risk.studentId.toString(), risk]));
}

async function loadAttendanceMap(studentIds: Array<unknown>): Promise<Map<string, number>> {
  if (studentIds.length === 0) {
    return new Map<string, number>();
  }

  const attendanceStats = (await Attendance.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    {
      $group: {
        _id: "$studentId",
        total: { $sum: 1 },
        presentLike: {
          $sum: {
            $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0],
          },
        },
      },
    },
  ])) as Array<{ _id: { toString(): string }; total: number; presentLike: number }>;

  return new Map(
    attendanceStats.map((entry) => [entry._id.toString(), roundPercent(entry.presentLike, entry.total)])
  );
}

async function loadMarksMap(studentIds: Array<unknown>): Promise<Map<string, number>> {
  if (studentIds.length === 0) {
    return new Map<string, number>();
  }

  const marksStats = (await Assessment.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    {
      $group: {
        _id: "$studentId",
        totalObtained: { $sum: "$marksObtained" },
        totalMax: { $sum: "$maxMarks" },
      },
    },
  ])) as Array<{ _id: { toString(): string }; totalObtained: number; totalMax: number }>;

  return new Map(
    marksStats.map((entry) => [entry._id.toString(), roundPercent(entry.totalObtained, entry.totalMax)])
  );
}

async function loadAssignmentMap(
  studentIds: Array<unknown>
): Promise<Map<string, { completed: number; total: number }>> {
  if (studentIds.length === 0) {
    return new Map<string, { completed: number; total: number }>();
  }

  const assignmentStats = (await StudentAssignment.aggregate([
    { $match: { studentId: { $in: studentIds } } },
    {
      $group: {
        _id: "$studentId",
        total: { $sum: 1 },
        completed: {
          $sum: {
            $cond: [{ $in: ["$status", ["submitted_on_time", "submitted_late"]] }, 1, 0],
          },
        },
      },
    },
  ])) as Array<{ _id: { toString(): string }; total: number; completed: number }>;

  return new Map(
    assignmentStats.map((entry) => [entry._id.toString(), { completed: entry.completed, total: entry.total }])
  );
}

export async function buildCoordinatorStudentRecords(): Promise<CoordinatorStudentRecord[]> {
  const students = (await User.find({ role: "student" })
    .select("fullName studentId department batch")
    .sort({ fullName: 1 })
    .lean()) as Array<{
      _id: { toString(): string };
      fullName: string;
      studentId?: string;
      department?: string;
      batch?: string;
    }>;

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student._id);

  const [latestRiskMap, attendanceMap, marksMap, assignmentMap] = await Promise.all([
    loadLatestRiskMap(studentIds),
    loadAttendanceMap(studentIds),
    loadMarksMap(studentIds),
    loadAssignmentMap(studentIds),
  ]);

  return students.map((student) => {
    const dbId = student._id.toString();
    const attendance = attendanceMap.get(dbId) ?? 0;
    const avgMarks = marksMap.get(dbId) ?? 0;

    const assignment = assignmentMap.get(dbId) || { completed: 0, total: 0 };
    const assignmentCompletionRate =
      assignment.total > 0 ? roundPercent(assignment.completed, assignment.total) : 100;

    const latestRisk = latestRiskMap.get(dbId);
    const healthScore = latestRisk
      ? normalizeRiskToHealthScore(latestRisk.score, latestRisk.riskLevel)
      : calculateHealthScoreFromInputs(attendance, avgMarks, assignmentCompletionRate);

    const mappedRiskLevel = latestRisk ? mapDbRiskLevel(latestRisk.riskLevel) : null;
    const riskLevel = mappedRiskLevel || riskLevelFromHealthScore(healthScore);

    return {
      id: (student.studentId || dbId).trim(),
      dbId,
      name: student.fullName,
      department: student.department || "Unknown",
      classBatch: student.batch || "Unassigned",
      attendance,
      avgMarks,
      assignmentsCompleted: assignment.completed,
      totalAssignments: assignment.total,
      riskScore: healthScore,
      riskLevel,
      riskExplanation: buildRiskExplanation(
        riskLevel,
        attendance,
        avgMarks,
        assignmentCompletionRate,
        latestRisk?.factors
      ),
    };
  });
}

export function buildSystemAggregates(
  students: CoordinatorStudentRecord[]
): CoordinatorSystemAggregates {
  const riskDist: CoordinatorRiskDistribution = {
    Low: 0,
    Medium: 0,
    High: 0,
  };

  for (const student of students) {
    riskDist[student.riskLevel] += 1;
  }

  const atRisk = riskDist.High;

  const departmentMap = new Map<string, { total: number; atRisk: number }>();
  for (const student of students) {
    const key = student.department;
    const existing = departmentMap.get(key) || { total: 0, atRisk: 0 };
    existing.total += 1;
    if (student.riskLevel === "High") {
      existing.atRisk += 1;
    }
    departmentMap.set(key, existing);
  }

  const deptStats: CoordinatorDepartmentStat[] = Array.from(departmentMap.entries())
    .map(([department, stats]) => ({
      department,
      total: stats.total,
      atRisk: stats.atRisk,
      riskRate: roundPercent(stats.atRisk, stats.total),
    }))
    .sort((a, b) => b.riskRate - a.riskRate);

  return {
    total: students.length,
    atRisk,
    riskDist,
    deptStats,
  };
}

export async function buildAtRiskTrend(
  studentIds: string[],
  fallbackAtRisk: number,
  totalStudents: number
): Promise<Array<{ month: string; atRisk: number; total: number }>> {
  const now = new Date();
  const months: Date[] = [];

  for (let i = 3; i >= 0; i -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  const monthKeys = months.map(
    (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  );

  if (studentIds.length === 0) {
    return months.map((month) => ({
      month: month.toLocaleString("en-US", { month: "short" }),
      atRisk: 0,
      total: 0,
    }));
  }

  const monthAggregate = (await RiskScore.aggregate([
    {
      $match: {
        studentId: { $in: studentIds },
        calculatedAt: { $gte: months[0] },
      },
    },
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
          studentId: "$studentId",
          monthKey: "$monthKey",
        },
        doc: { $first: "$$ROOT" },
      },
    },
    {
      $group: {
        _id: "$_id.monthKey",
        atRisk: {
          $sum: {
            $cond: [{ $in: ["$doc.riskLevel", ["high"]] }, 1, 0],
          },
        },
      },
    },
  ])) as Array<{ _id: string; atRisk: number }>;

  const atRiskByMonth = new Map(monthAggregate.map((entry) => [entry._id, entry.atRisk]));

  let previous = fallbackAtRisk;
  return months.map((month, index) => {
    const key = monthKeys[index];
    const current = atRiskByMonth.has(key) ? atRiskByMonth.get(key) || 0 : previous;
    previous = current;

    return {
      month: month.toLocaleString("en-US", { month: "short" }),
      atRisk: current,
      total: totalStudents,
    };
  });
}

export function buildClassStats(students: CoordinatorStudentRecord[]): Array<{
  class: string;
  avgScore: number;
  atRiskCount: number;
}> {
  const classMap = new Map<string, { marksTotal: number; count: number; atRisk: number }>();

  for (const student of students) {
    const key = student.classBatch || "Unassigned";
    const stats = classMap.get(key) || { marksTotal: 0, count: 0, atRisk: 0 };
    stats.marksTotal += student.avgMarks;
    stats.count += 1;
    if (student.riskLevel === "High") {
      stats.atRisk += 1;
    }
    classMap.set(key, stats);
  }

  return Array.from(classMap.entries())
    .map(([classBatch, stats]) => ({
      class: classBatch,
      avgScore: stats.count > 0 ? Math.round(stats.marksTotal / stats.count) : 0,
      atRiskCount: stats.atRisk,
    }))
    .sort((a, b) => a.class.localeCompare(b.class));
}

function scoreSeverity(level: CoordinatorRiskLevel): number {
  if (level === "High") return 3;
  if (level === "Medium") return 2;
  return 1;
}

function toActionLabel(actionType: string): string {
  switch (actionType) {
    case "counseling":
      return "Academic Counseling";
    case "extra_class":
      return "Extra Classes";
    case "academic_support":
      return "Academic Support";
    case "parent_meeting":
      return "Parent Meeting";
    case "peer_mentoring":
      return "Peer Mentoring";
    default:
      return "Other";
  }
}

function findBeforeOrAtDate(
  scores: Array<{ calculatedAt: Date; score: number; riskLevel: string }>,
  date: Date
): { calculatedAt: Date; score: number; riskLevel: string } | null {
  for (let index = scores.length - 1; index >= 0; index -= 1) {
    if (scores[index].calculatedAt <= date) {
      return scores[index];
    }
  }
  return null;
}

function findAfterDate(
  scores: Array<{ calculatedAt: Date; score: number; riskLevel: string }>,
  date: Date
): { calculatedAt: Date; score: number; riskLevel: string } | null {
  for (const score of scores) {
    if (score.calculatedAt > date) {
      return score;
    }
  }
  return null;
}

export async function buildCoordinatorInterventions(limit = 300): Promise<{
  interventions: Array<{
    id: string;
    studentId: string;
    studentName: string;
    facultyName: string;
    type: string;
    date: string;
    scoreBefore: number;
    scoreAfter: number;
    status: string;
  }>;
  metrics: {
    totalInterventions: number;
    improvedCases: number;
    avgImprovement: number;
  };
}> {
  const actions = (await MentorAction.find({})
    .sort({ date: -1 })
    .limit(limit)
    .lean()) as Array<{
      _id: { toString(): string };
      studentId: { toString(): string };
      mentorId: { toString(): string };
      actionType: string;
      date: Date;
      status: string;
    }>;

  if (actions.length === 0) {
    return {
      interventions: [],
      metrics: {
        totalInterventions: 0,
        improvedCases: 0,
        avgImprovement: 0,
      },
    };
  }

  const studentDbIds = [...new Set(actions.map((action) => action.studentId.toString()))];
  const mentorDbIds = [...new Set(actions.map((action) => action.mentorId.toString()))];

  const users = (await User.find({
    _id: { $in: [...studentDbIds, ...mentorDbIds] },
  })
    .select("fullName studentId")
    .lean()) as Array<{
      _id: { toString(): string };
      fullName: string;
      studentId?: string;
    }>;

  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  const riskHistory = (await RiskScore.find({ studentId: { $in: studentDbIds } })
    .select("studentId score riskLevel calculatedAt")
    .sort({ calculatedAt: 1 })
    .lean()) as Array<{
      studentId: { toString(): string };
      score: number;
      riskLevel: string;
      calculatedAt: Date;
    }>;

  const riskByStudent = new Map<string, Array<{ calculatedAt: Date; score: number; riskLevel: string }>>();
  for (const record of riskHistory) {
    const key = record.studentId.toString();
    const existing = riskByStudent.get(key) || [];
    existing.push({
      calculatedAt: record.calculatedAt,
      score: record.score,
      riskLevel: record.riskLevel,
    });
    riskByStudent.set(key, existing);
  }

  const interventions = actions.map((action) => {
    const studentDbId = action.studentId.toString();
    const mentorDbId = action.mentorId.toString();

    const scores = riskByStudent.get(studentDbId) || [];
    const before = findBeforeOrAtDate(scores, action.date);
    const after = findAfterDate(scores, action.date);
    const latest = scores.length > 0 ? scores[scores.length - 1] : null;

    const scoreBefore = before
      ? normalizeRiskToHealthScore(before.score, before.riskLevel)
      : latest
        ? normalizeRiskToHealthScore(latest.score, latest.riskLevel)
        : 0;

    const scoreAfter = after
      ? normalizeRiskToHealthScore(after.score, after.riskLevel)
      : latest
        ? normalizeRiskToHealthScore(latest.score, latest.riskLevel)
        : scoreBefore;

    const student = userMap.get(studentDbId);
    const mentor = userMap.get(mentorDbId);

    return {
      id: action._id.toString(),
      studentId: (student?.studentId || studentDbId).trim(),
      studentName: student?.fullName || "Unknown Student",
      facultyName: mentor?.fullName || "Unknown Mentor",
      type: toActionLabel(action.actionType),
      date: action.date.toISOString(),
      scoreBefore,
      scoreAfter,
      status: action.status,
    };
  });

  const totalInterventions = interventions.length;
  const improvedCases = interventions.filter((entry) => entry.scoreAfter > entry.scoreBefore).length;
  const avgImprovement =
    totalInterventions > 0
      ? Math.round(
        interventions.reduce((sum, entry) => sum + (entry.scoreAfter - entry.scoreBefore), 0) /
            totalInterventions
      )
      : 0;

  return {
    interventions,
    metrics: {
      totalInterventions,
      improvedCases,
      avgImprovement,
    },
  };
}

export function buildTopRiskStudents(students: CoordinatorStudentRecord[], count = 5): CoordinatorStudentRecord[] {
  return [...students]
    .filter((student) => student.riskLevel === "High")
    .sort((a, b) => {
      const severityDiff = scoreSeverity(b.riskLevel) - scoreSeverity(a.riskLevel);
      if (severityDiff !== 0) return severityDiff;
      return a.riskScore - b.riskScore;
    })
    .slice(0, count);
}

export type CoordinatorUiRole = "Student" | "Mentor" | "Teacher" | "Coordinator";

export interface CoordinatorUserRecord {
  id: string;
  name: string;
  email: string;
  role: CoordinatorUiRole;
  department: string;
  status: "Active" | "Inactive";
}

export function dbRoleToUiRole(role: string): CoordinatorUiRole {
  if (role === "student") return "Student";
  if (role === "mentor") return "Mentor";
  if (role === "teacher") return "Teacher";
  return "Coordinator";
}

export function uiRoleToDbRole(role: string): "student" | "mentor" | "teacher" | "coordinator" | null {
  const normalized = role.trim().toLowerCase();
  if (normalized === "student") return "student";
  if (normalized === "mentor") return "mentor";
  if (normalized === "teacher") return "teacher";
  if (normalized === "coordinator") return "coordinator";
  return null;
}

export async function ensureCoordinatorUser(coordinatorId: string): Promise<{
  ok: boolean;
  message?: string;
}> {
  const coordinator = (await User.findById(coordinatorId)
    .select("role")
    .lean()) as { role?: string } | null;

  if (!coordinator || coordinator.role !== "coordinator") {
    return {
      ok: false,
      message: "Only coordinators can perform this action",
    };
  }

  return { ok: true };
}

export async function listCoordinatorUsers(roleFilter: string | null): Promise<CoordinatorUserRecord[]> {
  const dbRole = roleFilter ? uiRoleToDbRole(roleFilter) : null;

  const query: Record<string, unknown> = {};
  if (dbRole) {
    query.role = dbRole;
  }

  const users = (await User.find(query)
    .select("fullName email role department isEmailVerified")
    .sort({ createdAt: -1 })
    .lean()) as Array<{
      _id: { toString(): string };
      fullName: string;
      email: string;
      role: string;
      department?: string;
      isEmailVerified?: boolean;
    }>;

  return users.map((user) => ({
    id: user._id.toString(),
    name: user.fullName,
    email: user.email,
    role: dbRoleToUiRole(user.role),
    department: user.department || "Unknown",
    status: user.isEmailVerified ? "Active" : "Inactive",
  }));
}
