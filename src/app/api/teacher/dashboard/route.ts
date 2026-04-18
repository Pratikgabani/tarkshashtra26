import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  buildTeacherBaseData,
  calculateSubjectPercentage,
  getRiskLevelFromPercentage,
  type UiRiskLevel,
} from "@/src/lib/teacherBackend";

/**
 * GET /api/teacher/dashboard?teacherId=...
 * Returns all core datasets required by teacher pages + summary cards.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const teacherId = request.nextUrl.searchParams.get("teacherId");
    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "teacherId query parameter is required" },
        { status: 400 }
      );
    }

    const baseData = await buildTeacherBaseData(teacherId);
    if (!baseData) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    const belowThresholdIds = new Set<string>();
    let totalPercentage = 0;
    let subjectPairs = 0;

    for (const student of baseData.students) {
      for (const subject of baseData.subjects) {
        if (!baseData.marks[student.id]?.[subject.id]) continue;

        const percentage = calculateSubjectPercentage(
          baseData.marks,
          student.id,
          subject.id,
          baseData.assessments
        );

        totalPercentage += percentage;
        subjectPairs += 1;

        if (percentage < 40) {
          belowThresholdIds.add(student.id);
        }
      }
    }

    let submissionSlots = 0;
    let submittedCount = 0;

    for (const assignment of baseData.assignments) {
      const studentSubmissions = Object.values(baseData.submissions[assignment.id] || {});
      submissionSlots += studentSubmissions.length;
      submittedCount += studentSubmissions.filter((record) => record.status !== "Not Submitted").length;
    }

    const submissionRate = submissionSlots > 0
      ? Math.round((submittedCount / submissionSlots) * 100)
      : 0;

    const averageMarks = subjectPairs > 0
      ? Math.round(totalPercentage / subjectPairs)
      : 0;

    const riskDistribution: Record<UiRiskLevel, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    for (const student of baseData.students) {
      const percentages: number[] = [];

      for (const subject of baseData.subjects) {
        if (!baseData.marks[student.id]?.[subject.id]) continue;
        percentages.push(
          calculateSubjectPercentage(
            baseData.marks,
            student.id,
            subject.id,
            baseData.assessments
          )
        );
      }

      if (percentages.length === 0) continue;
      const average = Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length);
      riskDistribution[getRiskLevelFromPercentage(average)] += 1;
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const upcomingDeadlines = baseData.assignments
      .filter((assignment) => {
        const due = new Date(assignment.dueDate);
        return !Number.isNaN(due.getTime()) && due >= startOfToday;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);

    return NextResponse.json({
      success: true,
      data: {
        ...baseData,
        summary: {
          totalStudents: baseData.students.length,
          belowThreshold: belowThresholdIds.size,
          submissionRate,
          averageMarks,
          flaggedStudents: Object.keys(baseData.flags).length,
        },
        riskDistribution,
        upcomingDeadlines,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Teacher dashboard API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load teacher dashboard" },
      { status: 500 }
    );
  }
}
