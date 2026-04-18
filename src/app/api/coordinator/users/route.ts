import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import {
  dbRoleToUiRole,
  ensureCoordinatorUser,
  listCoordinatorUsers,
  uiRoleToDbRole,
} from "@/src/lib/coordinatorBackend";
import Alert from "@/src/models/alert";
import Assessment from "@/src/models/assessment";
import Attendance from "@/src/models/attendance";
import LmsActivity from "@/src/models/lmsActivity";
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";
import RiskScore from "@/src/models/riskScore";
import StudentAssignment from "@/src/models/studentAssignment";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";

function parseActiveStatus(status: string | undefined): boolean | null {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "active") return true;
  if (normalized === "inactive") return false;
  return null;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

function isValidObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value);
}

/**
 * GET /api/coordinator/users?role=Student
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const role = request.nextUrl.searchParams.get("role");
    const users = await listCoordinatorUsers(role);

    return NextResponse.json({
      success: true,
      data: {
        users,
        summary: {
          total: users.length,
          byRole: {
            Student: users.filter((user) => user.role === "Student").length,
            Teacher: users.filter((user) => user.role === "Teacher").length,
            Mentor: users.filter((user) => user.role === "Mentor").length,
            Coordinator: users.filter((user) => user.role === "Coordinator").length,
          },
        },
      },
    });
  } catch (error) {
    console.error("Coordinator users GET error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/coordinator/users
 * Body: {
 *   coordinatorId, name, email, role, department, status, password,
 *   studentId?, semester?, batch?, assignedMentorId?
 * }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      coordinatorId?: string;
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      status?: string;
      password?: string;
      studentId?: string;
      semester?: number;
      batch?: string;
      assignedMentorId?: string;
    };

    const coordinatorId = body.coordinatorId?.trim();
    if (!coordinatorId) {
      return NextResponse.json(
        { success: false, message: "coordinatorId is required" },
        { status: 400 }
      );
    }

    const auth = await ensureCoordinatorUser(coordinatorId);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: 403 }
      );
    }

    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const department = body.department?.trim() || "";
    const dbRole = uiRoleToDbRole(body.role || "");
    const active = parseActiveStatus(body.status);

    if (!name || !email || !department || !dbRole || active === null) {
      return NextResponse.json(
        { success: false, message: "name, email, role, department, and status are required" },
        { status: 400 }
      );
    }

    const password = body.password || "";
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const createPayload: Record<string, unknown> = {
      fullName: name,
      email,
      password: await bcrypt.hash(password, 10),
      role: dbRole,
      department,
      isEmailVerified: active,
    };

    if (dbRole === "student") {
      if (typeof body.studentId === "string" && body.studentId.trim()) {
        createPayload.studentId = body.studentId.trim();
      }
      if (typeof body.batch === "string" && body.batch.trim()) {
        createPayload.batch = body.batch.trim();
      }
      if (typeof body.semester === "number" && body.semester >= 1 && body.semester <= 8) {
        createPayload.semester = body.semester;
      }

      if (typeof body.assignedMentorId === "string" && body.assignedMentorId.trim()) {
        if (!isValidObjectId(body.assignedMentorId)) {
          return NextResponse.json(
            { success: false, message: "assignedMentorId must be a valid user id" },
            { status: 400 }
          );
        }

        const mentor = await User.findById(body.assignedMentorId)
          .select("role")
          .lean();
        if (!mentor || mentor.role !== "mentor") {
          return NextResponse.json(
            { success: false, message: "assignedMentorId must reference a mentor" },
            { status: 400 }
          );
        }
        createPayload.assignedMentorId = body.assignedMentorId;
      }
    }

    const created = await User.create(createPayload);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          id: created._id.toString(),
          name: created.fullName,
          email: created.email,
          role: dbRoleToUiRole(created.role),
          department: created.department,
          status: created.isEmailVerified ? "Active" : "Inactive",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    console.error("Coordinator users POST error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/coordinator/users
 * Body: {
 *   coordinatorId, id, name, email, role, department, status,
 *   password?, studentId?, semester?, batch?, assignedMentorId?
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      coordinatorId?: string;
      id?: string;
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      status?: string;
      password?: string;
      studentId?: string;
      semester?: number;
      batch?: string;
      assignedMentorId?: string;
    };

    const coordinatorId = body.coordinatorId?.trim();
    const userId = body.id?.trim();

    if (!coordinatorId || !userId) {
      return NextResponse.json(
        { success: false, message: "coordinatorId and id are required" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const auth = await ensureCoordinatorUser(coordinatorId);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: 403 }
      );
    }

    const existing = await User.findById(userId).select("_id").lean();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const name = body.name?.trim() || "";
    const email = body.email?.trim().toLowerCase() || "";
    const department = body.department?.trim() || "";
    const dbRole = uiRoleToDbRole(body.role || "");
    const active = parseActiveStatus(body.status);

    if (!name || !email || !department || !dbRole || active === null) {
      return NextResponse.json(
        { success: false, message: "name, email, role, department, and status are required" },
        { status: 400 }
      );
    }

    const setUpdates: Record<string, unknown> = {
      fullName: name,
      email,
      role: dbRole,
      department,
      isEmailVerified: active,
    };

    const unsetUpdates: Record<string, string> = {};

    if (body.password && body.password.trim()) {
      if (body.password.trim().length < 8) {
        return NextResponse.json(
          { success: false, message: "password must be at least 8 characters" },
          { status: 400 }
        );
      }
      setUpdates.password = await bcrypt.hash(body.password.trim(), 10);
    }

    if (dbRole === "student") {
      if (typeof body.studentId === "string") {
        setUpdates.studentId = body.studentId.trim() || undefined;
      }
      if (typeof body.batch === "string") {
        setUpdates.batch = body.batch.trim() || undefined;
      }
      if (typeof body.semester === "number" && body.semester >= 1 && body.semester <= 8) {
        setUpdates.semester = body.semester;
      }

      if (typeof body.assignedMentorId === "string") {
        const mentorId = body.assignedMentorId.trim();
        if (!mentorId) {
          unsetUpdates.assignedMentorId = "";
        } else {
          if (!isValidObjectId(mentorId)) {
            return NextResponse.json(
              { success: false, message: "assignedMentorId must be a valid user id" },
              { status: 400 }
            );
          }
          const mentor = await User.findById(mentorId).select("role").lean();
          if (!mentor || mentor.role !== "mentor") {
            return NextResponse.json(
              { success: false, message: "assignedMentorId must reference a mentor" },
              { status: 400 }
            );
          }
          setUpdates.assignedMentorId = mentorId;
        }
      }
    } else {
      unsetUpdates.studentId = "";
      unsetUpdates.semester = "";
      unsetUpdates.batch = "";
      unsetUpdates.assignedMentorId = "";
    }

    const updateQuery: Record<string, unknown> = { $set: setUpdates };
    if (Object.keys(unsetUpdates).length > 0) {
      updateQuery.$unset = unsetUpdates;
    }

    const updated = await User.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: updated._id.toString(),
        name: updated.fullName,
        email: updated.email,
        role: dbRoleToUiRole(updated.role),
        department: updated.department || "Unknown",
        status: updated.isEmailVerified ? "Active" : "Inactive",
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    console.error("Coordinator users PUT error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/coordinator/users
 * Body: { coordinatorId, id }
 */
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      coordinatorId?: string;
      id?: string;
    };

    const coordinatorId = body.coordinatorId?.trim();
    const userId = body.id?.trim();

    if (!coordinatorId || !userId) {
      return NextResponse.json(
        { success: false, message: "coordinatorId and id are required" },
        { status: 400 }
      );
    }

    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    if (coordinatorId === userId) {
      return NextResponse.json(
        { success: false, message: "You cannot delete your own coordinator account" },
        { status: 400 }
      );
    }

    const auth = await ensureCoordinatorUser(coordinatorId);
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: 403 }
      );
    }

    const target = await User.findById(userId).select("role").lean();
    if (!target) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (target.role === "student") {
      const studentActionDocs = await MentorAction.find({ studentId: userId })
        .select("_id")
        .lean();
      const studentActionIds = studentActionDocs.map((action) => action._id);

      await Promise.all([
        Attendance.deleteMany({ studentId: userId }),
        Assessment.deleteMany({ studentId: userId }),
        StudentAssignment.deleteMany({ studentId: userId }),
        LmsActivity.deleteMany({ studentId: userId }),
        RiskScore.deleteMany({ studentId: userId }),
        Alert.deleteMany({ studentId: userId }),
        MentorAction.deleteMany({ studentId: userId }),
        MentorRemark.deleteMany({
          $or: [{ studentId: userId }, { actionId: { $in: studentActionIds } }],
        }),
      ]);
    }

    if (target.role === "mentor") {
      const mentorActionDocs = await MentorAction.find({ mentorId: userId })
        .select("_id")
        .lean();
      const mentorActionIds = mentorActionDocs.map((action) => action._id);

      await Promise.all([
        User.updateMany({ assignedMentorId: userId }, { $unset: { assignedMentorId: "" } }),
        MentorAction.deleteMany({ mentorId: userId }),
        MentorRemark.deleteMany({
          $or: [{ mentorId: userId }, { actionId: { $in: mentorActionIds } }],
        }),
        Alert.deleteMany({ mentorId: userId }),
      ]);
    }

    if (target.role === "teacher") {
      await Subject.updateMany({ teacherId: userId }, { $unset: { teacherId: "" } });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Coordinator users DELETE error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
