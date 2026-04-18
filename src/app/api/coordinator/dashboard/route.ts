import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import {
  buildAtRiskTrend,
  buildCoordinatorStudentRecords,
  buildSystemAggregates,
} from "@/src/lib/coordinatorBackend";

/**
 * GET /api/coordinator/dashboard
 * Institution-wide snapshot for coordinator dashboard cards and charts.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "coordinator");
    if (!auth.ok) return auth.response;

    const students = await buildCoordinatorStudentRecords();
    const aggregates = buildSystemAggregates(students);

    const trend = await buildAtRiskTrend(
      students.map((student) => student.dbId),
      aggregates.atRisk,
      aggregates.total
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalStudents: aggregates.total,
          atRiskStudents: aggregates.atRisk,
          criticalCases: aggregates.riskDist.Critical,
          departments: aggregates.deptStats.length,
        },
        total: aggregates.total,
        atRisk: aggregates.atRisk,
        riskDist: aggregates.riskDist,
        deptStats: aggregates.deptStats,
        trend,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Coordinator dashboard API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load coordinator dashboard" },
      { status: 500 }
    );
  }
}
