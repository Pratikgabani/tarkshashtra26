import { NextRequest, NextResponse } from "next/server";

/**
 * Dummy Risk Score API
 * ----------------------------------------------------------
 * This endpoint is a placeholder. Replace the URL in
 * EXTERNAL_RISK_API_URL with the real ML model endpoint
 * once it is ready. The response contract stays the same.
 * ----------------------------------------------------------
 */

const EXTERNAL_RISK_API_URL = process.env.EXTERNAL_RISK_API_URL?.trim() || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId is required" },
        { status: 400 }
      );
    }

    // If a real external API is configured, call it
    if (EXTERNAL_RISK_API_URL) {
      try {
        const externalRes = await fetch(EXTERNAL_RISK_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        });
        const externalData = await externalRes.json();
        return NextResponse.json({ success: true, ...externalData });
      } catch (err) {
        console.error("External risk API failed, using dummy data:", err);
      }
    }

    // --- Dummy response ---
    const score = 62;
    const riskLevel = score <= 25 ? "low" : score <= 50 ? "medium" : score <= 75 ? "high" : "critical";

    return NextResponse.json({
      success: true,
      data: {
        studentId,
        score,
        riskLevel,
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
