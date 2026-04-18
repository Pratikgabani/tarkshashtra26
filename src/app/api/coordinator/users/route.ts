import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import { getCoordinatorUsers, toDbRole } from "@/src/lib/coordinatorService";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDB();
    const users = await getCoordinatorUsers();
    return NextResponse.json({ success: true, data: { users } });
  } catch (error) {
    console.error("Coordinator users GET API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

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

    const { name, email, role, department, status, studentId, semester, batch, password } = body;

    if (!name || !email || !role || !department) {
      return NextResponse.json(
        { success: false, message: "Name, email, role, and department are required" },
        { status: 400 }
      );
    }

    const dbRole = toDbRole(role);
    if (!dbRole) {
      return NextResponse.json(
        { success: false, message: "Role must be Student, Teacher, or Mentor" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const plaintextPassword = password?.trim() || "password123";
    const hashedPassword = await bcrypt.hash(plaintextPassword, 10);

    const created = await User.create({
      fullName: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: dbRole,
      department: department.trim(),
      studentId: dbRole === "student" ? studentId?.trim() : undefined,
      semester: dbRole === "student" ? semester : undefined,
      batch: dbRole === "student" ? batch?.trim() : undefined,
      isEmailVerified: true,
      isActive: status !== "Inactive",
    });

    const users = await getCoordinatorUsers();
    const createdUser = users.find((user) => user.id === created._id.toString());

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          user: createdUser,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Coordinator users POST API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}
