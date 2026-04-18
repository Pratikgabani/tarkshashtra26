import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import Attendance from "@/src/models/attendance";
import { buildTeacherBaseData } from "@/src/lib/teacherBackend";

type AttendanceStatus = "present" | "absent" | "late";

interface AttendanceUpdateInput {
  studentId?: string;
  status?: AttendanceStatus | null;
}

interface AttendanceBulkInput {
  teacherId?: string;
  subjectId?: string;
  date?: string;
  updates?: AttendanceUpdateInput[];
}

function parseIsoDateOnly(value: string | null | undefined): Date {
  if (value) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function nextUtcDay(value: Date): Date {
  return new Date(value.getTime() + 24 * 60 * 60 * 1000);
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return value === "present" || value === "absent" || value === "late";
}

async function buildTeacherAttendancePayload(
  teacherId: string,
  subjectIdParam?: string | null,
  dateParam?: string | null
) {
  const baseData = await buildTeacherBaseData(teacherId);
  if (!baseData) return null;

  if (baseData.subjects.length === 0) {
    return {
      teacher: baseData.teacher,
      subjects: [],
      activeSubjectId: null,
      attendanceDate: toIsoDateOnly(parseIsoDateOnly(dateParam)),
      summary: {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        unmarked: 0,
      },
      rows: [],
    };
  }

  const activeSubject =
    baseData.subjects.find((subject) => subject.id === subjectIdParam) ||
    baseData.subjects[0];

  const attendanceDate = parseIsoDateOnly(dateParam);
  const nextDay = nextUtcDay(attendanceDate);

  const cohort = baseData.students;
  const cohortIds = cohort.map((student) => student.id);

  const attendanceDocs = cohortIds.length > 0
    ? await Attendance.find({
      subjectId: activeSubject.id,
      studentId: { $in: cohortIds },
      date: { $gte: attendanceDate, $lt: nextDay },
    })
      .sort({ updatedAt: -1 })
      .lean()
    : [];

  const attendanceByStudent = new Map<string, AttendanceStatus>();
  for (const entry of attendanceDocs) {
    const sid = entry.studentId.toString();
    if (!attendanceByStudent.has(sid)) {
      attendanceByStudent.set(sid, entry.status);
    }
  }

  const rows = cohort
    .map((student) => ({
      studentId: student.id,
      name: student.name,
      enrollmentId: student.studentId,
      batch: student.batch,
      semester: student.semester,
      status: attendanceByStudent.get(student.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const summary = {
    total: rows.length,
    present: rows.filter((row) => row.status === "present").length,
    absent: rows.filter((row) => row.status === "absent").length,
    late: rows.filter((row) => row.status === "late").length,
    unmarked: rows.filter((row) => row.status === null).length,
  };

  return {
    teacher: baseData.teacher,
    subjects: baseData.subjects,
    activeSubjectId: activeSubject.id,
    attendanceDate: toIsoDateOnly(attendanceDate),
    summary,
    rows,
  };
}

/**
 * GET /api/teacher/attendance?teacherId=...&subjectId=...&date=YYYY-MM-DD
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

    const data = await buildTeacherAttendancePayload(
      scopedTeacherId.userId,
      request.nextUrl.searchParams.get("subjectId"),
      request.nextUrl.searchParams.get("date")
    );

    if (!data) {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Teacher attendance GET API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load attendance" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teacher/attendance
 * Body: { teacherId?, subjectId, date, updates: [{ studentId, status | null }] }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as AttendanceBulkInput;

    const scopedTeacherId = resolveScopedUserId(auth.session.sub, body.teacherId);
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    const subjectId = body.subjectId?.trim();
    const updates = Array.isArray(body.updates) ? body.updates : [];

    if (!subjectId || updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "subjectId and updates are required" },
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

    const subject = baseData.subjects.find((item) => item.id === subjectId);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Teacher does not have access to this subject" },
        { status: 403 }
      );
    }

    const attendanceDate = parseIsoDateOnly(body.date);
    const nextDay = nextUtcDay(attendanceDate);

    const eligibleStudentIds = new Set(baseData.students.map((student) => student.id));

    const errors: string[] = [];

    for (const [index, update] of updates.entries()) {
      const row = index + 1;
      const studentId = update.studentId?.trim();
      const status = update.status;

      if (!studentId) {
        errors.push(`Row ${row}: studentId is required`);
        continue;
      }

      if (!eligibleStudentIds.has(studentId)) {
        errors.push(`Row ${row}: student not found`);
        continue;
      }

      if (status !== null && !isAttendanceStatus(status)) {
        errors.push(`Row ${row}: invalid attendance status`);
        continue;
      }

      if (status === null) {
        await Attendance.deleteMany({
          studentId,
          subjectId,
          date: { $gte: attendanceDate, $lt: nextDay },
        });
        continue;
      }

      await Attendance.findOneAndUpdate(
        {
          studentId,
          subjectId,
          date: { $gte: attendanceDate, $lt: nextDay },
        },
        {
          $set: {
            status,
            date: attendanceDate,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: "Some updates failed validation", errors },
        { status: 400 }
      );
    }

    const refreshed = await buildTeacherAttendancePayload(
      teacherId,
      subjectId,
      toIsoDateOnly(attendanceDate)
    );

    return NextResponse.json({
      success: true,
      message: "Attendance updated successfully",
      data: refreshed,
    });
  } catch (error) {
    console.error("Teacher attendance PUT API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update attendance" },
      { status: 500 }
    );
  }
}
