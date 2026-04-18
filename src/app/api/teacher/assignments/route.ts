import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";
import {
  buildTeacherBaseData,
  uiSubmissionStatusToDbStatus,
  type UiSubmissionStatus,
} from "@/src/lib/teacherBackend";

interface CreateAssignmentInput {
  teacherId: string;
  title: string;
  description?: string;
  subjectId: string;
  dueDate: string;
  maxMarks: number;
}

interface SubmissionUpdateInput {
  teacherId: string;
  assignmentId: string;
  studentId: string;
  status: UiSubmissionStatus;
  marks: number | null;
}

interface BulkStatusUpdateInput {
  teacherId: string;
  assignmentId: string;
  status: UiSubmissionStatus;
  marksBehavior?: "keep" | "clear";
}

function isSubmissionStatus(value: string): value is UiSubmissionStatus {
  return value === "On Time" || value === "Late" || value === "Not Submitted";
}

async function hasTeacherAccessToSubject(teacherId: string, subjectId: string): Promise<boolean> {
  const subject = await Subject.findOne({ _id: subjectId, teacherId }).lean();
  return Boolean(subject);
}

async function hasTeacherAccessToAssignment(teacherId: string, assignmentId: string): Promise<boolean> {
  const assignment = await Assignment.findById(assignmentId).lean();
  if (!assignment) return false;
  return hasTeacherAccessToSubject(teacherId, assignment.subjectId.toString());
}

async function ensureStudentAssignment(assignmentId: string, studentId: string): Promise<void> {
  await StudentAssignment.findOneAndUpdate(
    { assignmentId, studentId },
    { $setOnInsert: { status: "not_submitted", marksObtained: null, submittedAt: null } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * GET /api/teacher/assignments?teacherId=...
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

    const data = await buildTeacherBaseData(teacherId);
    if (!data) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Teacher assignments GET API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load assignment data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/assignments
 * Body: CreateAssignmentInput
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as Partial<CreateAssignmentInput>;

    const scopedTeacherId = resolveScopedUserId(auth.session.sub, body.teacherId);
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    if (!body.title || !body.subjectId || !body.dueDate || typeof body.maxMarks !== "number") {
      return NextResponse.json(
        { success: false, message: "teacherId, title, subjectId, dueDate and maxMarks are required" },
        { status: 400 }
      );
    }

    const hasAccess = await hasTeacherAccessToSubject(teacherId, body.subjectId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Teacher does not have access to this subject" },
        { status: 403 }
      );
    }

    if (body.maxMarks < 1 || body.maxMarks > 1000) {
      return NextResponse.json(
        { success: false, message: "maxMarks must be between 1 and 1000" },
        { status: 400 }
      );
    }

    const due = new Date(body.dueDate);
    if (Number.isNaN(due.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid dueDate" },
        { status: 400 }
      );
    }

    const assignment = await Assignment.create({
      title: body.title.trim(),
      description: (body.description || "").trim(),
      subjectId: body.subjectId,
      dueDate: due,
      maxMarks: body.maxMarks,
    });

    const subject = await Subject.findById(body.subjectId).lean();
    if (subject) {
      const students = await User.find({
        role: "student",
        department: subject.department,
        semester: subject.semester,
      })
        .select("_id")
        .lean();

      if (students.length > 0) {
        await StudentAssignment.insertMany(
          students.map((student) => ({
            studentId: student._id,
            assignmentId: assignment._id,
            status: "not_submitted",
            marksObtained: null,
            submittedAt: null,
          }))
        );
      }
    }

    const refreshedData = await buildTeacherBaseData(teacherId);

    return NextResponse.json({
      success: true,
      message: "Assignment created successfully",
      assignmentId: assignment._id.toString(),
      data: refreshedData,
    });
  } catch (error) {
    console.error("Teacher assignments POST API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/assignments
 * Body: SubmissionUpdateInput
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as Partial<SubmissionUpdateInput>;

    const scopedTeacherId = resolveScopedUserId(auth.session.sub, body.teacherId);
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    if (!body.assignmentId || !body.studentId || !body.status) {
      return NextResponse.json(
        { success: false, message: "teacherId, assignmentId, studentId and status are required" },
        { status: 400 }
      );
    }

    if (!isSubmissionStatus(body.status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const hasAccess = await hasTeacherAccessToAssignment(teacherId, body.assignmentId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Teacher does not have access to this assignment" },
        { status: 403 }
      );
    }

    const assignment = await Assignment.findById(body.assignmentId).lean();
    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    await ensureStudentAssignment(body.assignmentId, body.studentId);

    const marks = body.marks ?? null;
    if (marks !== null && (typeof marks !== "number" || marks < 0 || marks > assignment.maxMarks)) {
      return NextResponse.json(
        { success: false, message: `marks must be between 0 and ${assignment.maxMarks}` },
        { status: 400 }
      );
    }

    const dbStatus = uiSubmissionStatusToDbStatus(body.status);
    const now = new Date();

    await StudentAssignment.findOneAndUpdate(
      { assignmentId: body.assignmentId, studentId: body.studentId },
      {
        $set: {
          status: dbStatus,
          marksObtained: dbStatus === "not_submitted" ? null : marks,
          submittedAt: dbStatus === "not_submitted" ? null : now,
        },
      },
      { new: true }
    );

    const refreshedData = await buildTeacherBaseData(teacherId);

    return NextResponse.json({
      success: true,
      message: "Submission updated successfully",
      data: refreshedData,
    });
  } catch (error) {
    console.error("Teacher assignments PUT API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update submission" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/teacher/assignments
 * Body: BulkStatusUpdateInput
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as Partial<BulkStatusUpdateInput>;

    const scopedTeacherId = resolveScopedUserId(auth.session.sub, body.teacherId);
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    if (!body.assignmentId || !body.status) {
      return NextResponse.json(
        { success: false, message: "teacherId, assignmentId and status are required" },
        { status: 400 }
      );
    }

    if (!isSubmissionStatus(body.status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const hasAccess = await hasTeacherAccessToAssignment(teacherId, body.assignmentId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Teacher does not have access to this assignment" },
        { status: 403 }
      );
    }

    const assignment = await Assignment.findById(body.assignmentId).lean();
    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    const subject = await Subject.findById(assignment.subjectId).lean();
    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Subject not found for assignment" },
        { status: 404 }
      );
    }

    const students = await User.find({
      role: "student",
      department: subject.department,
      semester: subject.semester,
    })
      .select("_id")
      .lean();

    const dbStatus = uiSubmissionStatusToDbStatus(body.status);
    const now = new Date();

    for (const student of students) {
      await ensureStudentAssignment(body.assignmentId, student._id.toString());

      const updatePayload: Record<string, unknown> = {
        status: dbStatus,
        submittedAt: dbStatus === "not_submitted" ? null : now,
      };

      if (dbStatus === "not_submitted" || body.marksBehavior === "clear") {
        updatePayload.marksObtained = null;
      }

      await StudentAssignment.findOneAndUpdate(
        { assignmentId: body.assignmentId, studentId: student._id },
        {
          $set: updatePayload,
        },
        { new: true }
      );
    }

    const refreshedData = await buildTeacherBaseData(teacherId);

    return NextResponse.json({
      success: true,
      message: "Bulk assignment status updated",
      data: refreshedData,
    });
  } catch (error) {
    console.error("Teacher assignments PATCH API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update assignment statuses" },
      { status: 500 }
    );
  }
}
