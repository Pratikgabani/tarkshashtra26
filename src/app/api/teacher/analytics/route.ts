import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import {
  buildTeacherBaseData,
  calculateSubjectPercentage,
  getRiskLevelFromPercentage,
  type UiRiskLevel,
} from "@/src/lib/teacherBackend";

interface HistogramBin {
  range: string;
  low: number;
  high: number;
  count: number;
}

function buildHistogramBins(): HistogramBin[] {
  return [
    { range: "0-10", low: 0, high: 10, count: 0 },
    { range: "10-20", low: 10, high: 20, count: 0 },
    { range: "20-30", low: 20, high: 30, count: 0 },
    { range: "30-40", low: 30, high: 40, count: 0 },
    { range: "40-50", low: 40, high: 50, count: 0 },
    { range: "50-60", low: 50, high: 60, count: 0 },
    { range: "60-70", low: 60, high: 70, count: 0 },
    { range: "70-80", low: 70, high: 80, count: 0 },
    { range: "80-90", low: 80, high: 90, count: 0 },
    { range: "90-100", low: 90, high: 100, count: 0 },
  ];
}

/**
 * GET /api/teacher/analytics?teacherId=...&subjectId=...
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const scopedTeacherId = resolveScopedUserId(
      auth.session.sub,
      request.nextUrl.searchParams.get("teacherId")
    );
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    const baseData = await buildTeacherBaseData(teacherId);
    if (!baseData) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    if (baseData.subjects.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teacher: baseData.teacher,
          subjects: [],
          activeSubjectId: null,
          assessments: baseData.assessments,
          summary: null,
          riskDistribution: { Low: 0, Medium: 0, High: 0, Critical: 0 },
          assignmentSubmissionBreakdown: { onTime: 0, late: 0, notSubmitted: 0 },
          averagesByAssessment: [],
          histogram: buildHistogramBins(),
          belowThresholdStudents: [],
          studentSummary: [],
        },
      });
    }

    const requestedSubjectId = request.nextUrl.searchParams.get("subjectId");
    const activeSubject = baseData.subjects.find((subject) => subject.id === requestedSubjectId) || baseData.subjects[0];

    const activeStudents = baseData.students.filter((student) =>
      Boolean(baseData.marks[student.id]?.[activeSubject.id])
    );

    const studentPercentages = activeStudents.map((student) => {
      const percentage = calculateSubjectPercentage(
        baseData.marks,
        student.id,
        activeSubject.id,
        baseData.assessments
      );

      return {
        student,
        percentage,
      };
    });

    const classAverage = studentPercentages.length > 0
      ? Math.round(
        studentPercentages.reduce((sum, entry) => sum + entry.percentage, 0) /
        studentPercentages.length
      )
      : 0;

    const highest = studentPercentages.length > 0
      ? Math.max(...studentPercentages.map((entry) => entry.percentage))
      : 0;

    const lowest = studentPercentages.length > 0
      ? Math.min(...studentPercentages.map((entry) => entry.percentage))
      : 0;

    const subjectAssignments = baseData.assignments.filter((assignment) => assignment.subjectId === activeSubject.id);

    let onTime = 0;
    let late = 0;
    let notSubmitted = 0;

    for (const assignment of subjectAssignments) {
      for (const student of activeStudents) {
        const record = baseData.submissions[assignment.id]?.[student.id];
        if (!record || record.status === "Not Submitted") {
          notSubmitted += 1;
        } else if (record.status === "Late") {
          late += 1;
        } else {
          onTime += 1;
        }
      }
    }

    const submissionSlots = onTime + late + notSubmitted;
    const submissionRate = submissionSlots > 0 ? Math.round(((onTime + late) / submissionSlots) * 100) : 0;

    const riskDistribution: Record<UiRiskLevel, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    for (const entry of studentPercentages) {
      riskDistribution[getRiskLevelFromPercentage(entry.percentage)] += 1;
    }

    const averagesByAssessment = baseData.assessments.map((assessment) => {
      const values = activeStudents
        .map((student) => baseData.marks[student.id]?.[activeSubject.id]?.[assessment.id])
        .filter((value): value is number => typeof value === "number");

      const average = values.length > 0
        ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
        : 0;

      const percentage = assessment.maxMarks > 0
        ? Math.round((average / assessment.maxMarks) * 100)
        : 0;

      return {
        id: assessment.id,
        name: assessment.label,
        maxMarks: assessment.maxMarks,
        average,
        percentage,
      };
    });

    const histogram = buildHistogramBins();
    for (const entry of studentPercentages) {
      const bucket = Math.min(Math.floor(entry.percentage / 10), 9);
      histogram[bucket].count += 1;
    }

    const belowThresholdStudents = studentPercentages
      .filter((entry) => entry.percentage < 40)
      .sort((a, b) => a.percentage - b.percentage)
      .map((entry) => ({
        id: entry.student.id,
        name: entry.student.name,
        studentId: entry.student.studentId,
        batch: entry.student.batch,
        percentage: entry.percentage,
        risk: getRiskLevelFromPercentage(entry.percentage),
        marks: baseData.assessments.map((assessment) => ({
          assessmentId: assessment.id,
          label: assessment.label,
          maxMarks: assessment.maxMarks,
          marks: baseData.marks[entry.student.id]?.[activeSubject.id]?.[assessment.id] ?? null,
        })),
      }));

    const studentSummary = studentPercentages
      .map((entry) => {
        let studentOnTime = 0;
        let studentLate = 0;
        let studentMissing = 0;

        for (const assignment of subjectAssignments) {
          const record = baseData.submissions[assignment.id]?.[entry.student.id];
          if (!record || record.status === "Not Submitted") {
            studentMissing += 1;
          } else if (record.status === "Late") {
            studentLate += 1;
          } else {
            studentOnTime += 1;
          }
        }

        return {
          id: entry.student.id,
          name: entry.student.name,
          studentId: entry.student.studentId,
          batch: entry.student.batch,
          percentage: entry.percentage,
          risk: getRiskLevelFromPercentage(entry.percentage),
          marks: baseData.assessments.map((assessment) => ({
            assessmentId: assessment.id,
            label: assessment.label,
            maxMarks: assessment.maxMarks,
            marks: baseData.marks[entry.student.id]?.[activeSubject.id]?.[assessment.id] ?? null,
          })),
          assignments: {
            onTime: studentOnTime,
            late: studentLate,
            notSubmitted: studentMissing,
          },
        };
      })
      .sort((a, b) => a.percentage - b.percentage);

    return NextResponse.json({
      success: true,
      data: {
        teacher: baseData.teacher,
        subjects: baseData.subjects,
        activeSubjectId: activeSubject.id,
        assessments: baseData.assessments,
        summary: {
          classAverage,
          highest,
          lowest,
          submissionRate,
          totalStudents: activeStudents.length,
          totalAssignments: subjectAssignments.length,
        },
        riskDistribution,
        assignmentSubmissionBreakdown: {
          onTime,
          late,
          notSubmitted,
        },
        averagesByAssessment,
        histogram,
        belowThresholdStudents,
        studentSummary,
      },
    });
  } catch (error) {
    console.error("Teacher analytics API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load teacher analytics" },
      { status: 500 }
    );
  }
}
