import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import Assessment from "@/src/models/assessment";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";
import {
  buildTeacherBaseData,
  uiAssessmentIdToDbAssessmentType,
  type DbAssessmentType,
  type UiAssessmentId,
} from "@/src/lib/teacherBackend";

interface MarkUpdateInput {
  studentId: string;
  subjectId: string;
  assessmentId: UiAssessmentId;
  marks: number | null;
}

interface BulkMarkUpdateInput {
  subjectId: string;
  assessmentId: UiAssessmentId;
  rows: Array<{ studentId: string; marks: number | null }>;
}

function isValidAssessmentId(value: string): value is UiAssessmentId {
  return value === "ut1" || value === "ut2" || value === "mid";
}

async function validateTeacherSubjectAccess(teacherId: string, subjectId: string): Promise<boolean> {
  const subject = await Subject.findOne({ _id: subjectId, teacherId }).lean();
  return Boolean(subject);
}

async function validateStudentForSubject(studentId: string, subjectId: string): Promise<boolean> {
  const [student, subject] = await Promise.all([
    User.findById(studentId).lean(),
    Subject.findById(subjectId).lean(),
  ]);

  if (!student || student.role !== "student" || !subject) return false;
  return student.department === subject.department && student.semester === subject.semester;
}

function normalizeMarks(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

async function upsertAssessmentMark(
  studentId: string,
  subjectId: string,
  dbType: DbAssessmentType,
  marks: number | null,
  maxMarks: number
): Promise<void> {
  const filter = {
    studentId,
    subjectId,
    assessmentType: dbType,
  };

  if (marks === null) {
    await Assessment.deleteOne(filter);
    return;
  }

  await Assessment.findOneAndUpdate(
    filter,
    {
      $set: {
        marksObtained: marks,
        maxMarks,
        date: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );
}

/**
 * GET /api/teacher/marks?teacherId=...
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

    const data = await buildTeacherBaseData(teacherId);
    if (!data) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Teacher marks GET API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load marks data" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/marks
 * Body: { teacherId, updates: MarkUpdateInput[] }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const updates = Array.isArray(body.updates) ? (body.updates as MarkUpdateInput[]) : [];

    if (!teacherId) {
      return NextResponse.json(
        { success: false, message: "teacherId is required" },
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "At least one mark update is required" },
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

    const assessmentMaxMap = new Map(
      baseData.assessments.map((assessment) => [assessment.id, assessment.maxMarks])
    );

    const errors: string[] = [];

    for (const update of updates) {
      if (!update.studentId || !update.subjectId || !update.assessmentId) {
        errors.push("studentId, subjectId and assessmentId are required for each update");
        continue;
      }

      if (!isValidAssessmentId(update.assessmentId)) {
        errors.push(`Invalid assessmentId: ${update.assessmentId}`);
        continue;
      }

      const hasSubjectAccess = await validateTeacherSubjectAccess(teacherId, update.subjectId);
      if (!hasSubjectAccess) {
        errors.push(`Teacher does not have access to subject ${update.subjectId}`);
        continue;
      }

      const isEligible = await validateStudentForSubject(update.studentId, update.subjectId);
      if (!isEligible) {
        errors.push(`Student ${update.studentId} is not eligible for subject ${update.subjectId}`);
        continue;
      }

      const assessmentMaxMarks = assessmentMaxMap.get(update.assessmentId) ?? 100;

      const score = normalizeMarks(update.marks);
      if (score !== null && (score < 0 || score > assessmentMaxMarks)) {
        errors.push(`Marks out of range for student ${update.studentId} in subject ${update.subjectId}`);
        continue;
      }

      const dbType = uiAssessmentIdToDbAssessmentType(update.assessmentId);
      await upsertAssessmentMark(update.studentId, update.subjectId, dbType, score, assessmentMaxMarks);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: "Some updates failed validation", errors },
        { status: 400 }
      );
    }

    const refreshedData = await buildTeacherBaseData(teacherId);

    return NextResponse.json({
      success: true,
      message: "Marks updated successfully",
      data: refreshedData,
    });
  } catch (error) {
    console.error("Teacher marks PUT API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update marks" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/marks
 * Body: { teacherId, update: BulkMarkUpdateInput }
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const teacherId = typeof body.teacherId === "string" ? body.teacherId : "";
    const update = body.update as BulkMarkUpdateInput | undefined;

    if (!teacherId || !update?.subjectId || !update?.assessmentId || !Array.isArray(update.rows)) {
      return NextResponse.json(
        { success: false, message: "teacherId and a valid bulk update payload are required" },
        { status: 400 }
      );
    }

    if (!isValidAssessmentId(update.assessmentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid assessmentId" },
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

    const assessmentMaxMap = new Map(
      baseData.assessments.map((assessment) => [assessment.id, assessment.maxMarks])
    );

    const hasSubjectAccess = await validateTeacherSubjectAccess(teacherId, update.subjectId);
    if (!hasSubjectAccess) {
      return NextResponse.json(
        { success: false, message: "Teacher does not have access to this subject" },
        { status: 403 }
      );
    }

    const assessmentMaxMarks = assessmentMaxMap.get(update.assessmentId) ?? 100;

    const dbType = uiAssessmentIdToDbAssessmentType(update.assessmentId);
    const errors: string[] = [];

    for (const row of update.rows) {
      if (!row.studentId) {
        errors.push("studentId is required for each row");
        continue;
      }

      const score = normalizeMarks(row.marks);
      if (score !== null && (score < 0 || score > assessmentMaxMarks)) {
        errors.push(`Marks out of range for student ${row.studentId}`);
        continue;
      }

      const eligible = await validateStudentForSubject(row.studentId, update.subjectId);
      if (!eligible) {
        errors.push(`Student ${row.studentId} is not eligible for subject ${update.subjectId}`);
        continue;
      }

      await upsertAssessmentMark(row.studentId, update.subjectId, dbType, score, assessmentMaxMarks);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: "Some rows failed validation", errors },
        { status: 400 }
      );
    }

    const refreshedData = await buildTeacherBaseData(teacherId);

    return NextResponse.json({
      success: true,
      message: "Bulk marks update applied",
      data: refreshedData,
    });
  } catch (error) {
    console.error("Teacher marks PATCH API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to apply bulk marks update" },
      { status: 500 }
    );
  }
}
