import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";

interface CreateTeacherSubjectInput {
  teacherId?: string;
  name?: string;
  code?: string;
  semester?: number;
  maxMarks?: number;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

/**
 * GET /api/teacher/subjects?teacherId=...
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

    const teacher = await User.findById(teacherId)
      .select("_id fullName department role")
      .lean();

    if (!teacher || teacher.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    const subjects = await Subject.find({ teacherId })
      .sort({ code: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id.toString(),
          name: teacher.fullName,
          department: teacher.department,
        },
        subjects: subjects.map((subject) => ({
          id: subject._id.toString(),
          name: subject.name,
          code: subject.code,
          department: subject.department,
          semester: subject.semester,
          maxMarks: subject.maxMarks,
        })),
      },
    });
  } catch (error) {
    console.error("Teacher subjects GET API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load subjects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher/subjects
 * Body: { teacherId?, name, code, semester, maxMarks? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "teacher");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as CreateTeacherSubjectInput;

    const scopedTeacherId = resolveScopedUserId(auth.session.sub, body.teacherId);
    if (!scopedTeacherId.ok) return scopedTeacherId.response;
    const teacherId = scopedTeacherId.userId;

    const teacher = await User.findById(teacherId)
      .select("_id fullName department role")
      .lean();

    if (!teacher || teacher.role !== "teacher") {
      return NextResponse.json(
        { success: false, message: "Teacher not found" },
        { status: 404 }
      );
    }

    const name = body.name?.trim() || "";
    const code = (body.code || "").trim().toUpperCase().replace(/\s+/g, "");
    const semester = typeof body.semester === "number" ? body.semester : NaN;
    const maxMarks =
      typeof body.maxMarks === "number" && Number.isFinite(body.maxMarks)
        ? Math.round(body.maxMarks)
        : 100;

    if (!name || !code || !Number.isInteger(semester)) {
      return NextResponse.json(
        { success: false, message: "name, code and semester are required" },
        { status: 400 }
      );
    }

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { success: false, message: "name must be between 2 and 120 characters" },
        { status: 400 }
      );
    }

    if (code.length < 2 || code.length > 24) {
      return NextResponse.json(
        { success: false, message: "code must be between 2 and 24 characters" },
        { status: 400 }
      );
    }

    if (semester < 1 || semester > 8) {
      return NextResponse.json(
        { success: false, message: "semester must be between 1 and 8" },
        { status: 400 }
      );
    }

    if (maxMarks < 1 || maxMarks > 1000) {
      return NextResponse.json(
        { success: false, message: "maxMarks must be between 1 and 1000" },
        { status: 400 }
      );
    }

    const created = await Subject.create({
      name,
      code,
      department: teacher.department,
      semester,
      teacherId,
      maxMarks,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Subject created successfully",
        data: {
          subject: {
            id: created._id.toString(),
            name: created.name,
            code: created.code,
            department: created.department,
            semester: created.semester,
            maxMarks: created.maxMarks,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, message: "Subject code already exists. Use a unique code." },
        { status: 409 }
      );
    }

    console.error("Teacher subjects POST API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create subject" },
      { status: 500 }
    );
  }
}
