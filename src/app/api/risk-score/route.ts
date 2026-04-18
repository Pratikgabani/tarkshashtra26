import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import RiskScore, { type IRiskFactor } from "@/src/models/riskScore";
import Alert from "@/src/models/alert";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import StudentAssignment from "@/src/models/studentAssignment";
import LmsActivity from "@/src/models/lmsActivity";

/**
 * Risk score endpoint.
 * Uses external model when configured; otherwise computes
 * scores from live database signals.
 */

const EXTERNAL_RISK_API_URL = process.env.EXTERNAL_RISK_API_URL?.trim() || "";

type RiskLevel = "low" | "medium" | "high";

interface RiskResponsePayload {
  studentId: string;
  score: number;
  riskLevel: RiskLevel;
  factors: IRiskFactor[];
  calculatedAt: string;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveRiskLevel(score: number): RiskLevel {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  return "high";
}

function normalizeRiskLevel(value: unknown, score: number): RiskLevel {
  if (value === "low" || value === "medium" || value === "high") return value;
  return deriveRiskLevel(score);
}

function sanitizeFactor(raw: unknown, index: number): IRiskFactor {
  const fallbackLabel = `Factor ${index + 1}`;
  const factor = typeof raw === "object" && raw !== null ? raw as Partial<IRiskFactor> : {};

  const currentValue = Number.isFinite(Number(factor.currentValue)) ? Number(factor.currentValue) : 0;
  const threshold = Number.isFinite(Number(factor.threshold)) ? Number(factor.threshold) : 0;
  const weight = Number.isFinite(Number(factor.weight)) ? Number(factor.weight) : 0;
  const contribution = Number.isFinite(Number(factor.contribution)) ? Number(factor.contribution) : 0;

  return {
    factor: (factor.factor || `factor_${index + 1}`).toString(),
    label: (factor.label || fallbackLabel).toString(),
    currentValue,
    threshold,
    unit: (factor.unit || "").toString(),
    weight,
    contribution,
    suggestion: (factor.suggestion || "No suggestion available.").toString(),
  };
}

function normalizeRiskPayload(payload: unknown, studentId: string): RiskResponsePayload | null {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Partial<RiskResponsePayload>;
  const numericScore = Number(candidate.score);
  if (!Number.isFinite(numericScore)) return null;

  const score = clampScore(numericScore);
  const riskLevel = normalizeRiskLevel(candidate.riskLevel, score);

  const factors = Array.isArray(candidate.factors)
    ? candidate.factors.map((factor, index) => sanitizeFactor(factor, index))
    : [];

  const calculatedAtDate = candidate.calculatedAt ? new Date(candidate.calculatedAt) : new Date();
  const calculatedAt = Number.isNaN(calculatedAtDate.getTime())
    ? new Date().toISOString()
    : calculatedAtDate.toISOString();

  return {
    studentId,
    score,
    riskLevel,
    factors,
    calculatedAt,
  };
}

async function buildDatabasePayload(studentDbId: mongoose.Types.ObjectId, studentId: string): Promise<RiskResponsePayload> {
  const [attendanceRecords, assessments, studentAssignments, recentLms] = await Promise.all([
    Attendance.find({ studentId: studentDbId }).lean(),
    Assessment.find({ studentId: studentDbId }).lean(),
    StudentAssignment.find({ studentId: studentDbId }).lean(),
    LmsActivity.find({
      studentId: studentDbId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).lean(),
  ]);

  const totalClasses = attendanceRecords.length;
  const presentClasses = attendanceRecords.filter(
    (record) => record.status === "present" || record.status === "late"
  ).length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  const totalObtained = assessments.reduce((sum, assessment) => sum + assessment.marksObtained, 0);
  const totalMax = assessments.reduce((sum, assessment) => sum + assessment.maxMarks, 0);
  const marksPercent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

  const totalAssignments = studentAssignments.length;
  const submittedAssignments = studentAssignments.filter(
    (entry) => entry.status === "submitted_on_time" || entry.status === "submitted_late"
  ).length;
  const lateSubmissions = studentAssignments.filter((entry) => entry.status === "submitted_late").length;
  const assignmentCompletionPercent =
    totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;

  const weeklyLogins = recentLms.reduce((sum, activity) => sum + activity.loginCount, 0);
  const avgLoginsPerWeek = Math.round(weeklyLogins * 10) / 10;

  const attendanceDeficit = Math.max(0, (75 - attendancePercent) / 75);
  const marksDeficit = Math.max(0, (40 - marksPercent) / 40);
  const assignmentDeficit = Math.max(0, (80 - assignmentCompletionPercent) / 80);
  const lmsDeficit = Math.max(0, (3 - avgLoginsPerWeek) / 3);
  const latenessDeficit = Math.min(1, lateSubmissions / 5);

  const weightedScore =
    attendanceDeficit * 0.3 +
    marksDeficit * 0.25 +
    assignmentDeficit * 0.2 +
    lmsDeficit * 0.15 +
    latenessDeficit * 0.1;

  const score = clampScore(weightedScore * 100);

  return {
    studentId,
    score,
    riskLevel: deriveRiskLevel(score),
    factors: [
      {
        factor: "attendance",
        label: "Attendance",
        currentValue: attendancePercent,
        threshold: 75,
        unit: "%",
        weight: 0.3,
        contribution: Math.round(attendanceDeficit * 30),
        suggestion:
          attendancePercent < 75
            ? "Your attendance is below 75%. Increase class participation this week."
            : "Attendance is healthy. Keep it consistent.",
      },
      {
        factor: "assessment_marks",
        label: "Internal Assessment Marks",
        currentValue: marksPercent,
        threshold: 40,
        unit: "%",
        weight: 0.25,
        contribution: Math.round(marksDeficit * 25),
        suggestion:
          marksPercent < 40
            ? "Assessment marks are below passing threshold. Focus on weak subjects."
            : "Assessment marks are on track.",
      },
      {
        factor: "assignment_completion",
        label: "Assignment Completion",
        currentValue: assignmentCompletionPercent,
        threshold: 80,
        unit: "%",
        weight: 0.2,
        contribution: Math.round(assignmentDeficit * 20),
        suggestion:
          assignmentCompletionPercent < 80
            ? "Complete pending assignments to reduce your risk quickly."
            : "Assignment completion is strong.",
      },
      {
        factor: "lms_activity",
        label: "LMS Activity",
        currentValue: avgLoginsPerWeek,
        threshold: 3,
        unit: "logins/week",
        weight: 0.15,
        contribution: Math.round(lmsDeficit * 15),
        suggestion:
          avgLoginsPerWeek < 3
            ? "Increase LMS usage for announcements and learning material."
            : "LMS activity is good.",
      },
      {
        factor: "submission_timeliness",
        label: "Submission Timeliness",
        currentValue: lateSubmissions,
        threshold: 2,
        unit: "late submissions",
        weight: 0.1,
        contribution: Math.round(latenessDeficit * 10),
        suggestion:
          lateSubmissions > 2
            ? "Frequent late submissions increase academic risk. Submit earlier."
            : "Submission timeliness is acceptable.",
      },
    ],
    calculatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { studentId } = body as { studentId?: string };

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: "A valid studentId is required" },
        { status: 400 }
      );
    }

    const student = await User.findById(studentId).select("_id fullName studentId assignedMentorId role").lean();
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    let payload: RiskResponsePayload | null = null;
    let source: "external" | "database" = "database";

    // If a real external API is configured, call it
    if (EXTERNAL_RISK_API_URL) {
      try {
        const externalRes = await fetch(EXTERNAL_RISK_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });

        if (!externalRes.ok) {
          throw new Error(`External risk API returned ${externalRes.status}`);
        }

        const externalData = await externalRes.json();
        payload = normalizeRiskPayload(externalData?.data ?? externalData, studentId);
        if (payload) {
          source = "external";
        }
      } catch (err) {
        console.error("External risk API failed, using database scoring:", err);
      }
    }

    if (!payload) {
      payload = await buildDatabasePayload(student._id, studentId);
      source = "database";
    }

    const previousRisk = await RiskScore.findOne({ studentId: student._id })
      .sort({ calculatedAt: -1 })
      .select("riskLevel score calculatedAt")
      .lean();

    await RiskScore.create({
      studentId: student._id,
      score: payload.score,
      riskLevel: payload.riskLevel,
      factors: payload.factors,
      calculatedAt: new Date(payload.calculatedAt),
    });

    const previousRiskLevelRaw = previousRisk?.riskLevel ? String(previousRisk.riskLevel) : undefined;
    const previousRiskLevel = previousRiskLevelRaw === "critical"
      ? "high"
      : previousRiskLevelRaw;

    const enteredHighRisk = previousRiskLevel !== "high" && payload.riskLevel === "high";
    const mentorId = student.assignedMentorId;

    if (enteredHighRisk && mentorId && mongoose.Types.ObjectId.isValid(mentorId)) {
      const mentorObjectId = new mongoose.Types.ObjectId(mentorId);

      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      const existingAlert = await Alert.findOne({
        studentId: student._id,
        mentorId: mentorObjectId,
        type: "risk_threshold_crossed",
        sentAt: { $gte: dayStart },
      })
        .select("_id")
        .lean();

      if (!existingAlert) {
        await Alert.create({
          studentId: student._id,
          mentorId: mentorObjectId,
          type: "risk_threshold_crossed",
          priority: "high",
          title: "HIGH RISK ALERT - Immediate Action Required",
          message: `${student.fullName} (${student.studentId || student._id.toString()}) has moved into high risk with score ${payload.score}.`,
          actionLink: `/mentor/students/${student._id.toString()}`,
          status: "unread",
          sentAt: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...payload,
        source,
      },
    });
  } catch (error) {
    console.error("Risk score API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate risk score" },
      { status: 500 }
    );
  }
}
