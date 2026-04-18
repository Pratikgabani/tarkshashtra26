import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import RiskScore, { type IRiskFactor } from "@/src/models/riskScore";
import Alert from "@/src/models/alert";

/**
 * Dummy Risk Score API
 * ----------------------------------------------------------
 * This endpoint is a placeholder. Replace the URL in
 * EXTERNAL_RISK_API_URL with the real ML model endpoint
 * once it is ready. The response contract stays the same.
 * ----------------------------------------------------------
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

function buildDummyPayload(studentId: string): RiskResponsePayload {
  const score = 62;
  return {
    studentId,
    score,
    riskLevel: deriveRiskLevel(score),
    factors: [
      {
        factor: "attendance",
        label: "Attendance",
        currentValue: 58,
        threshold: 75,
        unit: "%",
        weight: 0.3,
        contribution: 34,
        suggestion: "Attend at least 7 more classes this month to reach the 75% threshold.",
      },
      {
        factor: "assessment_marks",
        label: "Internal Assessment Marks",
        currentValue: 28,
        threshold: 40,
        unit: "%",
        weight: 0.25,
        contribution: 25,
        suggestion: "Your marks in Data Structures are below passing. Attend the next remedial session.",
      },
      {
        factor: "assignment_completion",
        label: "Assignment Completion",
        currentValue: 56,
        threshold: 70,
        unit: "%",
        weight: 0.2,
        contribution: 22,
        suggestion: "You have 3 pending assignments. Submit them before the deadline to avoid penalties.",
      },
      {
        factor: "lms_activity",
        label: "LMS Activity",
        currentValue: 1.5,
        threshold: 3,
        unit: "logins/week",
        weight: 0.15,
        contribution: 13,
        suggestion: "Login to the LMS at least 3 times this week and review materials for Data Structures.",
      },
      {
        factor: "submission_timeliness",
        label: "Submission Timeliness",
        currentValue: 3,
        threshold: 2,
        unit: "late submissions",
        weight: 0.1,
        contribution: 6,
        suggestion: "You have 3 late submissions. Contact your teacher to discuss deadline extensions.",
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
    let source: "external" | "dummy" = "dummy";

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
        console.error("External risk API failed, using dummy data:", err);
      }
    }

    if (!payload) {
      payload = buildDummyPayload(studentId);
      source = "dummy";
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
