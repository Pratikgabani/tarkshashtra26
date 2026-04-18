import mongoose from "mongoose";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import LmsActivity from "@/src/models/lmsActivity";
import RiskScore, { type IRiskFactor, type RiskLevel } from "@/src/models/riskScore";
import StudentAssignment from "@/src/models/studentAssignment";

const DEFAULT_PREDICT_API_URL = "https://tark-core-api.onrender.com/predict";
const DEFAULT_MAX_AGE_MINUTES = 360;

const PREDICT_API_URL =
  process.env.RISK_PREDICT_API_URL?.trim() ||
  process.env.EXTERNAL_RISK_API_URL?.trim() ||
  DEFAULT_PREDICT_API_URL;

export type RiskPredictionSource = "external_predict" | "database_fallback";

export interface RiskPredictionSnapshot {
  studentId: string;
  score: number;
  riskLevel: RiskLevel;
  factors: IRiskFactor[];
  calculatedAt: Date;
  source: RiskPredictionSource | "legacy";
}

interface StudentRiskSignals {
  assignment: number;
  attendance: number;
  lms: number;
  marks: number;
  avgLoginsPerWeek: number;
  lateSubmissions: number;
}

interface EnsureRiskOptions {
  forceRefresh?: boolean;
  maxAgeMinutes?: number;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampRiskScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const bounded = Math.max(0, Math.min(100, value));
  return Number(bounded.toFixed(2));
}

function deriveRiskLevelFromScore(score: number): RiskLevel {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  return "high";
}

function mapApiRiskLabel(value: unknown): RiskLevel | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "high") {
    return normalized;
  }
  return null;
}

function lmsScoreFromWeeklyLogins(avgLoginsPerWeek: number): number {
  // 5+ weekly logins is considered full engagement.
  return clampPercentage((avgLoginsPerWeek / 5) * 100);
}

function calculateFallbackRiskScore(signals: StudentRiskSignals): number {
  const attendanceDeficit = Math.max(0, (75 - signals.attendance) / 75);
  const marksDeficit = Math.max(0, (40 - signals.marks) / 40);
  const assignmentDeficit = Math.max(0, (80 - signals.assignment) / 80);
  const lmsDeficit = Math.max(0, (60 - signals.lms) / 60);
  const lateSubmissionDeficit = Math.min(1, signals.lateSubmissions / 5);

  const weightedRisk =
    attendanceDeficit * 0.3 +
    marksDeficit * 0.25 +
    assignmentDeficit * 0.2 +
    lmsDeficit * 0.15 +
    lateSubmissionDeficit * 0.1;

  return clampRiskScore(weightedRisk * 100);
}

function buildRiskFactors(signals: StudentRiskSignals): IRiskFactor[] {
  const attendanceDeficit = Math.max(0, (75 - signals.attendance) / 75);
  const marksDeficit = Math.max(0, (40 - signals.marks) / 40);
  const assignmentDeficit = Math.max(0, (80 - signals.assignment) / 80);
  const lmsDeficit = Math.max(0, (60 - signals.lms) / 60);
  const lateSubmissionDeficit = Math.min(1, signals.lateSubmissions / 5);

  return [
    {
      factor: "attendance",
      label: "Attendance",
      currentValue: signals.attendance,
      threshold: 75,
      unit: "%",
      weight: 0.3,
      contribution: Math.round(attendanceDeficit * 30),
      suggestion:
        signals.attendance < 75
          ? "Increase class attendance to at least 75%."
          : "Attendance is healthy. Keep it consistent.",
    },
    {
      factor: "assessment_marks",
      label: "Internal Assessment Marks",
      currentValue: signals.marks,
      threshold: 40,
      unit: "%",
      weight: 0.25,
      contribution: Math.round(marksDeficit * 25),
      suggestion:
        signals.marks < 40
          ? "Focus on low-scoring subjects and weekly revision."
          : "Assessment performance is stable.",
    },
    {
      factor: "assignment_completion",
      label: "Assignment Completion",
      currentValue: signals.assignment,
      threshold: 80,
      unit: "%",
      weight: 0.2,
      contribution: Math.round(assignmentDeficit * 20),
      suggestion:
        signals.assignment < 80
          ? "Complete pending assignments before upcoming deadlines."
          : "Assignment completion is strong.",
    },
    {
      factor: "lms_activity",
      label: "LMS Activity",
      currentValue: Number(signals.avgLoginsPerWeek.toFixed(1)),
      threshold: 3,
      unit: "logins/week",
      weight: 0.15,
      contribution: Math.round(lmsDeficit * 15),
      suggestion:
        signals.avgLoginsPerWeek < 3
          ? "Use LMS more often for resources and announcements."
          : "LMS engagement is good.",
    },
    {
      factor: "submission_timeliness",
      label: "Submission Timeliness",
      currentValue: signals.lateSubmissions,
      threshold: 2,
      unit: "late submissions",
      weight: 0.1,
      contribution: Math.round(lateSubmissionDeficit * 10),
      suggestion:
        signals.lateSubmissions > 2
          ? "Reduce late submissions by planning work ahead."
          : "Submission timing is acceptable.",
    },
  ];
}

async function predictRiskFromExternalApi(
  signals: StudentRiskSignals
): Promise<{ score: number; riskLevel: RiskLevel } | null> {
  try {
    const response = await fetch(PREDICT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignment: signals.assignment,
        attendance: signals.attendance,
        lms: signals.lms,
        marks: signals.marks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Predict API returned ${response.status}`);
    }

    const raw = await response.json();
    const payload =
      raw && typeof raw === "object" && "data" in raw
        ? (raw as { data?: unknown }).data
        : raw;

    const predictedScore = Number(
      payload && typeof payload === "object"
        ? (payload as { risk_score_predicted?: unknown }).risk_score_predicted
        : undefined
    );

    if (!Number.isFinite(predictedScore)) {
      return null;
    }

    const score = clampRiskScore(predictedScore);
    const apiRiskLabel =
      payload && typeof payload === "object"
        ? (payload as { risk_label?: unknown }).risk_label
        : undefined;
    const riskLevel = mapApiRiskLabel(apiRiskLabel) || deriveRiskLevelFromScore(score);

    return { score, riskLevel };
  } catch (error) {
    console.error("External predict API failed, using fallback risk scoring:", error);
    return null;
  }
}

async function predictRisk(signals: StudentRiskSignals): Promise<{
  score: number;
  riskLevel: RiskLevel;
  source: RiskPredictionSource;
  factors: IRiskFactor[];
}> {
  const factors = buildRiskFactors(signals);
  const externalPrediction = await predictRiskFromExternalApi(signals);

  if (externalPrediction) {
    return {
      score: externalPrediction.score,
      riskLevel: externalPrediction.riskLevel,
      source: "external_predict",
      factors,
    };
  }

  const fallbackScore = calculateFallbackRiskScore(signals);
  return {
    score: fallbackScore,
    riskLevel: deriveRiskLevelFromScore(fallbackScore),
    source: "database_fallback",
    factors,
  };
}

async function buildRiskSignalsMap(
  studentObjectIds: mongoose.Types.ObjectId[]
): Promise<Map<string, StudentRiskSignals>> {
  const signalsMap = new Map<string, StudentRiskSignals>();
  if (studentObjectIds.length === 0) return signalsMap;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [attendanceAgg, marksAgg, assignmentAgg, lmsAgg] = await Promise.all([
    Attendance.aggregate([
      { $match: { studentId: { $in: studentObjectIds } } },
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          presentLike: {
            $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] },
          },
        },
      },
    ]),
    Assessment.aggregate([
      { $match: { studentId: { $in: studentObjectIds } } },
      {
        $group: {
          _id: "$studentId",
          totalObtained: { $sum: "$marksObtained" },
          totalMax: { $sum: "$maxMarks" },
        },
      },
    ]),
    StudentAssignment.aggregate([
      { $match: { studentId: { $in: studentObjectIds } } },
      {
        $group: {
          _id: "$studentId",
          total: { $sum: 1 },
          submitted: {
            $sum: {
              $cond: [{ $in: ["$status", ["submitted_on_time", "submitted_late"]] }, 1, 0],
            },
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "submitted_late"] }, 1, 0] },
          },
        },
      },
    ]),
    LmsActivity.aggregate([
      { $match: { studentId: { $in: studentObjectIds }, date: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$studentId", weeklyLogins: { $sum: "$loginCount" } } },
    ]),
  ]);

  const attendanceMap = new Map(
    attendanceAgg.map((entry) => {
      const total = Number(entry.total) || 0;
      const presentLike = Number(entry.presentLike) || 0;
      return [entry._id.toString(), total > 0 ? clampPercentage((presentLike / total) * 100) : 0] as const;
    })
  );

  const marksMap = new Map(
    marksAgg.map((entry) => {
      const totalMax = Number(entry.totalMax) || 0;
      const totalObtained = Number(entry.totalObtained) || 0;
      return [entry._id.toString(), totalMax > 0 ? clampPercentage((totalObtained / totalMax) * 100) : 0] as const;
    })
  );

  const assignmentMap = new Map(
    assignmentAgg.map((entry) => {
      const total = Number(entry.total) || 0;
      const submitted = Number(entry.submitted) || 0;
      const late = Number(entry.late) || 0;
      return [
        entry._id.toString(),
        {
          assignmentCompletionRate: total > 0 ? clampPercentage((submitted / total) * 100) : 100,
          lateSubmissions: late,
        },
      ] as const;
    })
  );

  const lmsMap = new Map(
    lmsAgg.map((entry) => {
      const weeklyLogins = Number(entry.weeklyLogins) || 0;
      return [entry._id.toString(), Number(weeklyLogins.toFixed(1))] as const;
    })
  );

  for (const studentObjectId of studentObjectIds) {
    const studentId = studentObjectId.toString();
    const attendance = attendanceMap.get(studentId) ?? 0;
    const marks = marksMap.get(studentId) ?? 0;
    const assignmentSummary = assignmentMap.get(studentId) || {
      assignmentCompletionRate: 100,
      lateSubmissions: 0,
    };
    const avgLoginsPerWeek = lmsMap.get(studentId) ?? 0;

    signalsMap.set(studentId, {
      assignment: assignmentSummary.assignmentCompletionRate,
      attendance,
      marks,
      lms: lmsScoreFromWeeklyLogins(avgLoginsPerWeek),
      avgLoginsPerWeek,
      lateSubmissions: assignmentSummary.lateSubmissions,
    });
  }

  return signalsMap;
}

function normalizeSnapshot(raw: {
  studentId: { toString(): string };
  score: number;
  riskLevel: string;
  factors?: IRiskFactor[];
  calculatedAt: Date;
  source?: string;
}): RiskPredictionSnapshot {
  const score = clampRiskScore(Number(raw.score));
  const mappedRiskLevel = mapApiRiskLabel(raw.riskLevel) || deriveRiskLevelFromScore(score);
  const source =
    raw.source === "external_predict" || raw.source === "database_fallback"
      ? raw.source
      : "legacy";

  return {
    studentId: raw.studentId.toString(),
    score,
    riskLevel: mappedRiskLevel,
    factors: Array.isArray(raw.factors) ? raw.factors : [],
    calculatedAt: new Date(raw.calculatedAt),
    source,
  };
}

export async function ensureLatestRiskScores(
  studentObjectIds: mongoose.Types.ObjectId[],
  options: EnsureRiskOptions = {}
): Promise<Map<string, RiskPredictionSnapshot>> {
  const uniqueById = new Map<string, mongoose.Types.ObjectId>();
  for (const studentObjectId of studentObjectIds) {
    uniqueById.set(studentObjectId.toString(), studentObjectId);
  }

  if (uniqueById.size === 0) {
    return new Map<string, RiskPredictionSnapshot>();
  }

  const normalizedStudentIds = Array.from(uniqueById.values());

  const latestRiskDocs = (await RiskScore.aggregate([
    { $match: { studentId: { $in: normalizedStudentIds } } },
    { $sort: { calculatedAt: -1 } },
    { $group: { _id: "$studentId", doc: { $first: "$$ROOT" } } },
    { $replaceRoot: { newRoot: "$doc" } },
  ])) as Array<{
    studentId: { toString(): string };
    score: number;
    riskLevel: string;
    factors?: IRiskFactor[];
    calculatedAt: Date;
    source?: string;
  }>;

  const snapshotMap = new Map<string, RiskPredictionSnapshot>(
    latestRiskDocs.map((doc) => {
      const snapshot = normalizeSnapshot(doc);
      return [snapshot.studentId, snapshot] as const;
    })
  );

  const forceRefresh = options.forceRefresh === true;
  const maxAgeMinutes = Math.max(0, options.maxAgeMinutes ?? DEFAULT_MAX_AGE_MINUTES);
  const staleCutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

  const idsToRefresh = Array.from(uniqueById.entries())
    .filter(([studentId]) => {
      if (forceRefresh) return true;
      const snapshot = snapshotMap.get(studentId);
      if (!snapshot) return true;
      if (snapshot.source === "legacy") return true;
      return snapshot.calculatedAt < staleCutoff;
    })
    .map(([, objectId]) => objectId);

  if (idsToRefresh.length > 0) {
    const signalsMap = await buildRiskSignalsMap(idsToRefresh);
    const now = new Date();

    const predictions = await Promise.all(
      idsToRefresh.map(async (studentObjectId) => {
        const studentId = studentObjectId.toString();
        const signals = signalsMap.get(studentId) || {
          assignment: 100,
          attendance: 0,
          marks: 0,
          lms: 0,
          avgLoginsPerWeek: 0,
          lateSubmissions: 0,
        };

        const predictedRisk = await predictRisk(signals);

        return {
          studentId: studentObjectId,
          score: predictedRisk.score,
          riskLevel: predictedRisk.riskLevel,
          factors: predictedRisk.factors,
          calculatedAt: now,
          source: predictedRisk.source,
        };
      })
    );

    if (predictions.length > 0) {
      await RiskScore.insertMany(predictions);

      for (const prediction of predictions) {
        snapshotMap.set(prediction.studentId.toString(), {
          studentId: prediction.studentId.toString(),
          score: prediction.score,
          riskLevel: prediction.riskLevel,
          factors: prediction.factors,
          calculatedAt: prediction.calculatedAt,
          source: prediction.source,
        });
      }
    }
  }

  return snapshotMap;
}
