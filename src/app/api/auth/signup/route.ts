import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { fullName, email, password, role, department, studentId, semester, batch } = body;

    // --- Validation ---
    if (!fullName || !email || !password || !role || !department) {
      return NextResponse.json(
        { success: false, message: "All required fields must be provided" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const validRoles = ["student", "mentor", "teacher", "coordinator"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role selected" },
        { status: 400 }
      );
    }

    // Students must provide a student ID
    if (role === "student" && !studentId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required for students" },
        { status: 400 }
      );
    }

    // --- Check for existing user ---
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // If student, check for duplicate student ID
    if (role === "student" && studentId) {
      const existingStudentId = await User.findOne({ studentId });
      if (existingStudentId) {
        return NextResponse.json(
          { success: false, message: "This Student ID is already registered" },
          { status: 409 }
        );
      }
    }

    // --- Hash password ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- Create user ---
    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      department: department.trim(),
      ...(role === "student" && {
        studentId: studentId?.trim(),
        semester: semester ? Number(semester) : undefined,
        batch: batch?.trim(),
      }),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Signup error:", error);

    // Handle Mongoose validation errors
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
