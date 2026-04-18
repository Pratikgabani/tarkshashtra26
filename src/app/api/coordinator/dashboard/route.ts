import { NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  getCoordinatorStudentRecords,
  getDepartmentStats,
  getRiskDistribution,
  getTrendData,
} from "@/src/lib/coordinatorService";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();

    const students = await getCoordinatorStudentRecords();
    const total = students.length;
    const atRisk = students.filter(
      (student) => student.riskLevel === "High" || student.riskLevel === "Critical"
    ).length;

    const riskDist = getRiskDistribution(students);
    const deptStats = getDepartmentStats(students);
    const trendData = await getTrendData(total, atRisk);

    return NextResponse.json({
      success: true,
      data: {
        total,
        atRisk,
        riskDist,
        deptStats,
        trendData,
      },
    });
  } catch (error) {
    console.error("Coordinator dashboard API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load coordinator dashboard data" },
      { status: 500 }
    );
  }
}
