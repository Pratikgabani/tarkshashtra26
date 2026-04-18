import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import Alert from "@/src/models/alert";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";
import { buildTeacherBaseData, toIsoDate } from "@/src/lib/teacherBackend";

interface TeacherFlagInput {
  teacherId: string;
  studentId: string;
  note: string;
}

async function teacherHasStudentAccess(teacherId: string, studentId: string): Promise<boolean> {
  const [teacherSubjects, student] = await Promise.all([
    Subject.find({ teacherId }).select("department semester").lean(),
    User.findById(studentId).lean(),
  ]);

  if (!student || student.role !== "student") return false;

  return teacherSubjects.some(
    (subject) => subject.department === student.department && subject.semester === student.semester
  );
}

/**
 * GET /api/teacher/flags?teacherId=...
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

    return NextResponse.json({
      success: true,
      data: {
        teacher: data.teacher,
        flags: data.flags,
      },
    });
  } catch (error) {
    console.error("Teacher flags GET API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load flags" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/flags
 * Body: TeacherFlagInput
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as Partial<TeacherFlagInput>;

    const scopedTeacherId = resolveScopedUserId(auth.session.sub, body.teacherId);
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    if (!body.studentId || !body.note) {
      return NextResponse.json(
        { success: false, message: "teacherId, studentId and note are required" },
        { status: 400 }
      );
    }

    const note = body.note.trim();
    if (note.length < 5 || note.length > 500) {
      return NextResponse.json(
        { success: false, message: "note must be between 5 and 500 characters" },
        { status: 400 }
      );
    }

    const hasAccess = await teacherHasStudentAccess(teacherId, body.studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, message: "Teacher does not have access to this student" },
        { status: 403 }
      );
    }

    const [teacher, student] = await Promise.all([
      User.findById(teacherId).lean(),
      User.findById(body.studentId).lean(),
    ]);

    if (!teacher || teacher.role !== "teacher" || !student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Teacher or student not found" },
        { status: 404 }
      );
    }

    const mentorId = student.assignedMentorId || undefined;

    const title = `Teacher Flag: ${student.fullName}`;
    const message = note;

    const alert = await Alert.create({
      studentId: student._id,
      mentorId,
      type: "teacher_flag",
      priority: "high",
      title,
      message,
      actionLink: `/mentor/students/${student._id.toString()}?teacherId=${teacher._id.toString()}`,
      status: "unread",
      sentAt: new Date(),
    });

    const refreshed = await buildTeacherBaseData(teacherId);

    return NextResponse.json({
      success: true,
      message: "Student flagged successfully",
      data: {
        flag: {
          id: alert._id.toString(),
          studentId: student._id.toString(),
          note,
          flaggedAt: toIsoDate(alert.sentAt),
        },
        flags: refreshed?.flags || {},
      },
    });
  } catch (error) {
    console.error("Teacher flags POST API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create flag" },
      { status: 500 }
    );
  }
}
