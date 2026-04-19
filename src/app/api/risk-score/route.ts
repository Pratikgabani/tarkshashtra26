import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import Alert from "@/src/models/alert";
import RiskScore from "@/src/models/riskScore";
import User from "@/src/models/user";
import { ensureLatestRiskScores } from "@/src/lib/riskScorePredictor";
import { sendAcademicAlertEmail } from "@/src/lib/mailer";

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
      .select("_id fullName email parentEmail studentId assignedMentorId role")
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

    const currentRiskLevel = latestRisk.riskLevel;
    const shouldAlertForRisk = currentRiskLevel === "medium" || currentRiskLevel === "high";
    const enteredElevatedRisk = shouldAlertForRisk && previousRiskLevel !== currentRiskLevel;
    const mentorId = student.assignedMentorId?.trim();

    if (enteredElevatedRisk) {
      const mentorObjectId = mentorId && mongoose.Types.ObjectId.isValid(mentorId)
        ? new mongoose.Types.ObjectId(mentorId)
        : undefined;
      const priority = currentRiskLevel === "high" ? "high" : "medium";
      const title =
        currentRiskLevel === "high"
          ? "HIGH RISK ALERT - Immediate Action Required"
          : "MEDIUM RISK ALERT - Intervention Recommended";
      const message =
        currentRiskLevel === "high"
          ? `${student.fullName} (${student.studentId || student._id.toString()}) has moved into high risk with score ${latestRisk.score}.`
          : `${student.fullName} (${student.studentId || student._id.toString()}) has moved into medium risk with score ${latestRisk.score}.`;
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);

      const existingAlertFilter: {
        studentId: mongoose.Types.ObjectId;
        mentorId?: mongoose.Types.ObjectId;
        type: string;
        priority: "medium" | "high";
        sentAt: { $gte: Date };
      } = {
        studentId: student._id,
        type: "risk_threshold_crossed",
        priority,
        sentAt: { $gte: dayStart },
      };

      if (mentorObjectId) {
        existingAlertFilter.mentorId = mentorObjectId;
      }

      const existingAlert = await Alert.findOne(existingAlertFilter)
        .select("_id")
        .lean();

      if (!existingAlert) {
        const alert = await Alert.create({
          studentId: student._id,
          mentorId: mentorObjectId,
          type: "risk_threshold_crossed",
          priority,
          title,
          message,
          actionLink: mentorObjectId
            ? `/mentor/students/${student._id.toString()}`
            : `/student/dashboard`,
          status: "unread",
          sentAt: now,
        });

        const mentor = mentorObjectId
          ? await User.findById(mentorObjectId).select("_id fullName email role").lean()
          : null;

        try {
          await sendAcademicAlertEmail({
            recipients: [student.email, student.parentEmail || "", mentor?.email || ""],
            studentName: student.fullName,
            studentIdentifier: student.studentId || student._id.toString(),
            mentorName: mentor?.fullName,
            title,
            message,
            riskLevel: currentRiskLevel,
            actionPath: alert.actionLink,
          });
        } catch (mailError) {
          console.error("Risk alert mail notification failed:", mailError);
        }
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
