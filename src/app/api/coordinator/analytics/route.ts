import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import {
  buildClassStats,
  buildCoordinatorStudentRecords,
  buildSystemAggregates,
} from "@/src/lib/coordinatorBackend";

/**
 * GET /api/coordinator/analytics
 * Aggregate insights used by analytics view.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "coordinator");
    if (!auth.ok) return auth.response;

    const students = await buildCoordinatorStudentRecords();
    const aggregates = buildSystemAggregates(students);
    const classStats = buildClassStats(students);

    const riskPercentage =
      aggregates.total > 0 ? Math.round((aggregates.atRisk / aggregates.total) * 100) : 0;

    const highestRiskDepartment =
      aggregates.deptStats.length > 0
        ? aggregates.deptStats[0]
        : { department: "N/A", total: 0, atRisk: 0, riskRate: 0 };

    const classWithMostAtRisk =
      classStats.length > 0
        ? [...classStats].sort((a, b) => b.atRiskCount - a.atRiskCount)[0]
        : { class: "N/A", avgScore: 0, atRiskCount: 0 };

    const overallAttendance =
      students.length > 0
        ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length)
        : 0;

    const overallMarks =
      students.length > 0
        ? Math.round(students.reduce((sum, student) => sum + student.avgMarks, 0) / students.length)
        : 0;

    const lowAssignmentEngagementCount = students.filter((student) => {
      if (student.totalAssignments === 0) return false;
      const completionRate = Math.round(
        (student.assignmentsCompleted / student.totalAssignments) * 100
      );
      return completionRate < 80;
    }).length;

    const insights = [
      {
        type: "Department",
        text: `${highestRiskDepartment.department} has the highest risk concentration (${highestRiskDepartment.riskRate}% of students).`,
        action: "Review intervention cadence with department faculty.",
      },
      {
        type: "Class",
        text: `${classWithMostAtRisk.class} has the most at-risk students (${classWithMostAtRisk.atRiskCount}).`,
        action: "Run targeted mentoring sessions for this class batch.",
      },
      {
        type: "Trend",
        text: `Institution averages: ${overallAttendance}% attendance and ${overallMarks}% marks, with ${lowAssignmentEngagementCount} students behind on assignment completion.`,
        action: "Trigger assignment and attendance nudges for flagged students.",
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        total: aggregates.total,
        atRisk: aggregates.atRisk,
        riskPercentage,
        deptStats: aggregates.deptStats,
        classStats,
        highestRiskDepartment,
        insights,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Coordinator analytics API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load coordinator analytics" },
      { status: 500 }
    );
  }
}
