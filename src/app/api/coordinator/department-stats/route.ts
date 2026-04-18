import { NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  getClassStats,
  getCoordinatorStudentRecords,
  getDepartmentStats,
  getInterventionAnalytics,
} from "@/src/lib/coordinatorService";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const students = await getCoordinatorStudentRecords();
    const deptStats = getDepartmentStats(students);
    const classStats = getClassStats(students);

    const total = students.length;
    const atRisk = students.filter(
      (student) => student.riskLevel === "High" || student.riskLevel === "Critical"
    ).length;
    const riskPercentage = total > 0 ? Math.round((atRisk / total) * 100) : 0;

    const highestRiskDept = deptStats[0];
    const highestRiskClass = classStats[0];

    const interventionStats = await getInterventionAnalytics();

    const insights = [
      highestRiskDept
        ? {
            type: "Department",
            text: `${highestRiskDept.department} has the highest risk concentration (${highestRiskDept.riskRate}% at-risk students).`,
            action: "Schedule a department-level academic review and mentorship plan.",
          }
        : {
            type: "Department",
            text: "No department-level risk trends are available yet.",
            action: "Seed more academic data to enable pattern detection.",
          },
      highestRiskClass
        ? {
            type: "Class",
            text: `${highestRiskClass.class} currently has ${highestRiskClass.atRiskCount} at-risk students.`,
            action: "Prioritize attendance and assignment recovery drives for this class.",
          }
        : {
            type: "Class",
            text: "No class-level trends are available yet.",
            action: "Add class and batch data to student profiles.",
          },
      interventionStats.totalInterventions > 0
        ? {
            type: "Intervention",
            text: `${interventionStats.improvementRate}% of interventions show measurable risk reduction so far.`,
            action: "Replicate intervention types with the strongest impact institution-wide.",
          }
        : {
            type: "Intervention",
            text: "No intervention outcomes are recorded yet.",
            action: "Start logging interventions to measure program effectiveness.",
          },
    ];

    return NextResponse.json({
      success: true,
      data: {
        total,
        atRisk,
        riskPercentage,
        deptStats,
        classStats,
        insights,
      },
    });
  } catch (error) {
    console.error("Coordinator department stats API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load department analytics" },
      { status: 500 }
    );
  }
}
