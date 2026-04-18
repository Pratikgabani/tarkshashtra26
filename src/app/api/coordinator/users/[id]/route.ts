import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import StudentAssignment from "@/src/models/studentAssignment";
import LmsActivity from "@/src/models/lmsActivity";
import RiskScore from "@/src/models/riskScore";
import Alert from "@/src/models/alert";
import Intervention from "@/src/models/intervention";
import { getCoordinatorUsers, toDbRole } from "@/src/lib/coordinatorService";

type RouteParams = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request: NextRequest, context: RouteParams) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const users = await getCoordinatorUsers();
    const user = users.find((item) => item.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Coordinator user GET by id API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      role?: string;
      department?: string;
      status?: "Active" | "Inactive";
      studentId?: string;
      semester?: number;
      batch?: string;
      password?: string;
    };

    const user = await User.findById(id);

    if (!user || !["student", "teacher", "mentor"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (body.email) {
      const normalizedEmail = body.email.toLowerCase().trim();
      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      }).lean();

      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "Another user already uses this email" },
          { status: 409 }
        );
      }

      user.email = normalizedEmail;
    }

    if (body.name) user.fullName = body.name.trim();
    if (body.department) user.department = body.department.trim();
    if (body.status) user.isActive = body.status !== "Inactive";

    if (body.role) {
      const dbRole = toDbRole(body.role);
      if (!dbRole) {
        return NextResponse.json(
          { success: false, message: "Role must be Student, Teacher, or Mentor" },
          { status: 400 }
        );
      }
      user.role = dbRole;

      if (dbRole !== "student") {
        user.studentId = undefined;
        user.semester = undefined;
        user.batch = undefined;
      }
    }

    if (user.role === "student") {
      user.studentId = body.studentId?.trim() || user.studentId;
      user.semester = body.semester ?? user.semester;
      user.batch = body.batch?.trim() || user.batch;
    }

    if (body.password && body.password.trim().length >= 6) {
      user.password = await bcrypt.hash(body.password.trim(), 10);
    }

    await user.save();

    const users = await getCoordinatorUsers();
    const updatedUser = users.find((item) => item.id === id);

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error("Coordinator user PUT API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteParams) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const user = await User.findById(id);

    if (!user || !["student", "teacher", "mentor"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "student") {
      await Promise.all([
        Attendance.deleteMany({ studentId: user._id }),
        Assessment.deleteMany({ studentId: user._id }),
        StudentAssignment.deleteMany({ studentId: user._id }),
        LmsActivity.deleteMany({ studentId: user._id }),
        RiskScore.deleteMany({ studentId: user._id }),
        Alert.deleteMany({ studentId: user._id }),
        Intervention.deleteMany({ studentId: user._id }),
      ]);
    }

    await User.deleteOne({ _id: user._id });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Coordinator user DELETE API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
