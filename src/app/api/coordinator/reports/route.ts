import { NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  buildCoordinatorStudentRecords,
  buildSystemAggregates,
  buildTopRiskStudents,
} from "@/src/lib/coordinatorBackend";

/**
 * GET /api/coordinator/reports
 * Report dataset used by coordinator report export page.
 */
export async function GET() {
  try {
    await connectDB();

    const students = await buildCoordinatorStudentRecords();
    const aggregates = buildSystemAggregates(students);
    const topRiskStudents = buildTopRiskStudents(students, 5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: aggregates.total,
          atRisk: aggregates.atRisk,
          riskDist: aggregates.riskDist,
        },
        students,
        topRiskStudents,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Coordinator reports API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load report data" },
      { status: 500 }
    );
  }
}
