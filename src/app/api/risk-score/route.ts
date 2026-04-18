import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import Alert from "@/src/models/alert";
import RiskScore from "@/src/models/riskScore";
import User from "@/src/models/user";
import { ensureLatestRiskScores } from "@/src/lib/riskScorePredictor";

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

    const student = await User.findById(studentId)
      .select("_id fullName studentId assignedMentorId role")
      .lean();

    if (!student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const previousRisk = await RiskScore.findOne({ studentId: student._id })
      .sort({ calculatedAt: -1 })
      .select("riskLevel score")
      .lean();

    const latestRiskMap = await ensureLatestRiskScores([student._id], {
      forceRefresh: true,
      maxAgeMinutes: 0,
    });

    const latestRisk = latestRiskMap.get(student._id.toString());
    if (!latestRisk) {
      return NextResponse.json(
        { success: false, message: "Failed to generate risk score" },
        { status: 500 }
      );
    }

    const previousRiskLevelRaw = previousRisk?.riskLevel
      ? String(previousRisk.riskLevel).toLowerCase()
      : undefined;
    const previousRiskLevel = previousRiskLevelRaw === "critical"
      ? "high"
      : previousRiskLevelRaw;

    const enteredHighRisk = previousRiskLevel !== "high" && latestRisk.riskLevel === "high";
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
          message: `${student.fullName} (${student.studentId || student._id.toString()}) has moved into high risk with score ${latestRisk.score}.`,
          actionLink: `/mentor/students/${student._id.toString()}`,
          status: "unread",
          sentAt: now,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        studentId: student._id.toString(),
        score: latestRisk.score,
        riskLevel: latestRisk.riskLevel,
        factors: latestRisk.factors,
        calculatedAt: latestRisk.calculatedAt.toISOString(),
        source: latestRisk.source,
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
