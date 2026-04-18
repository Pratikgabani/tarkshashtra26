import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import {
  buildCoordinatorStudentRecords,
  type CoordinatorRiskLevel,
} from "@/src/lib/coordinatorBackend";

const VALID_RISK_FILTERS = new Set(["all", "low", "medium", "high"]);

function severity(level: CoordinatorRiskLevel): number {
  if (level === "High") return 3;
  if (level === "Medium") return 2;
  return 1;
}

/**
 * GET /api/coordinator/students?search=&department=&class=&risk=
 * Student monitoring list with filter metadata.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "coordinator");
    if (!auth.ok) return auth.response;

    const search = request.nextUrl.searchParams.get("search")?.trim() || "";
    const department = request.nextUrl.searchParams.get("department")?.trim() || "All";
    const classBatch = request.nextUrl.searchParams.get("class")?.trim() || "All";
    const risk = (request.nextUrl.searchParams.get("risk") || "all").trim().toLowerCase();

    if (!VALID_RISK_FILTERS.has(risk)) {
      return NextResponse.json(
        { success: false, message: "Invalid risk filter" },
        { status: 400 }
      );
    }

    const students = await buildCoordinatorStudentRecords();

    const departments = Array.from(new Set(students.map((student) => student.department))).sort();
    const classes = Array.from(new Set(students.map((student) => student.classBatch))).sort();

    const normalizedSearch = search.toLowerCase();
    const filtered = students
      .filter((student) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          student.name.toLowerCase().includes(normalizedSearch) ||
          student.id.toLowerCase().includes(normalizedSearch);

        const matchesDepartment = department === "All" || student.department === department;
        const matchesClass = classBatch === "All" || student.classBatch === classBatch;
        const matchesRisk = risk === "all" || student.riskLevel.toLowerCase() === risk;

        return matchesSearch && matchesDepartment && matchesClass && matchesRisk;
      })
      .sort((a, b) => {
        const severityDiff = severity(b.riskLevel) - severity(a.riskLevel);
        if (severityDiff !== 0) return severityDiff;
        return a.riskScore - b.riskScore;
      });

    return NextResponse.json({
      success: true,
      data: {
        students: filtered,
        filters: {
          departments,
          classes,
          riskLevels: ["High", "Medium", "Low"],
        },
        summary: {
          total: students.length,
          matched: filtered.length,
        },
      },
    });
  } catch (error) {
    console.error("Coordinator students API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load coordinator students" },
      { status: 500 }
    );
  }
}
