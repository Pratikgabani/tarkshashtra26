import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  filterCoordinatorStudents,
  getCoordinatorStudentRecords,
} from "@/src/lib/coordinatorService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search");
    const department = searchParams.get("department");
    const classBatch = searchParams.get("classBatch");
    const riskLevel = searchParams.get("riskLevel");
    const limitParam = searchParams.get("limit");

    const parsedLimit = limitParam ? Number(limitParam) : null;

    const students = await getCoordinatorStudentRecords();
    const filtered = filterCoordinatorStudents(students, {
      search,
      department,
      classBatch,
      riskLevel,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : null,
    });

    const departments = [...new Set(students.map((student) => student.department))].sort();
    const classes = [...new Set(students.map((student) => student.classBatch))].sort();

    return NextResponse.json({
      success: true,
      data: {
        students: filtered,
        total: filtered.length,
        meta: {
          departments,
          classes,
        },
      },
    });
  } catch (error) {
    console.error("Coordinator at-risk API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load at-risk students" },
      { status: 500 }
    );
  }
}
