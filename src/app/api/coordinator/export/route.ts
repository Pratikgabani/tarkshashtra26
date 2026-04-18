import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  buildStudentsCsv,
  filterCoordinatorStudents,
  getCoordinatorStudentRecords,
} from "@/src/lib/coordinatorService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv").toLowerCase();

    if (format !== "csv") {
      return NextResponse.json(
        { success: false, message: "Only CSV export is currently supported" },
        { status: 400 }
      );
    }

    const students = await getCoordinatorStudentRecords();
    const filteredStudents = filterCoordinatorStudents(students, {
      search: searchParams.get("search"),
      department: searchParams.get("department"),
      classBatch: searchParams.get("classBatch"),
      riskLevel: searchParams.get("riskLevel"),
      limit: null,
    });

    const csvContent = buildStudentsCsv(filteredStudents);
    const fileDate = new Date().toISOString().slice(0, 10);
    const fileName = `coordinator-risk-report-${fileDate}.csv`;

    return new Response(`\uFEFF${csvContent}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Coordinator export API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export coordinator report" },
      { status: 500 }
    );
  }
}
