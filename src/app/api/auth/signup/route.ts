import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/DB_Connection";
import User, { type UserRole } from "@/src/models/user";
import { sendSignupOtpEmail } from "@/src/lib/mailer";
import { generateOtp, getOtpExpiryDate, hashOtp } from "@/src/lib/otp";

const VALID_ROLES: UserRole[] = ["student", "mentor", "teacher", "coordinator"];

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      department?: string;
      studentId?: string;
      semester?: number | string;
      batch?: string;
    };

    const { fullName, email, password, role, department, studentId, semester, batch } = body;

    // --- Validation ---
    if (!fullName || !email || !password || !role || !department) {
      return NextResponse.json(
        { success: false, message: "All required fields must be provided" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, message: "Invalid role selected" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedStudentId = studentId?.trim();
    const parsedSemester = semester !== undefined && semester !== null && semester !== ""
      ? Number(semester)
      : undefined;

    // Students must provide a student ID
    if (role === "student" && !normalizedStudentId) {
      return NextResponse.json(
        { success: false, message: "Student ID is required for students" },
        { status: 400 }
      );
    }

    if (
      role === "student" &&
      parsedSemester !== undefined &&
      (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 8)
    ) {
      return NextResponse.json(
        { success: false, message: "Semester must be a number between 1 and 8" },
        { status: 400 }
      );
    }

    // --- Check for existing user ---
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser?.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // If student, check for duplicate student ID among verified accounts
    if (role === "student" && normalizedStudentId) {
      const existingStudentId = await User.findOne({
        studentId: normalizedStudentId,
        isEmailVerified: true,
        email: { $ne: normalizedEmail },
      });

      if (existingStudentId) {
        return NextResponse.json(
          { success: false, message: "This Student ID is already registered" },
          { status: 409 }
        );
      }
    }

    // --- Hash password and prepare OTP ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiresAt = getOtpExpiryDate();

    const baseUserData = {
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      department: department.trim(),
      isEmailVerified: false,
      signupOtpHash: otpHash,
      signupOtpExpiresAt: otpExpiresAt,
      studentId: role === "student" ? normalizedStudentId : undefined,
      semester: role === "student" ? parsedSemester : undefined,
      batch: role === "student" ? batch?.trim() : undefined,
    };

    if (existingUser) {
      existingUser.fullName = baseUserData.fullName;
      existingUser.password = baseUserData.password;
      existingUser.role = baseUserData.role;
      existingUser.department = baseUserData.department;
      existingUser.isEmailVerified = false;
      existingUser.signupOtpHash = baseUserData.signupOtpHash;
      existingUser.signupOtpExpiresAt = baseUserData.signupOtpExpiresAt;
      existingUser.studentId = baseUserData.studentId;
      existingUser.semester = baseUserData.semester;
      existingUser.batch = baseUserData.batch;
      await existingUser.save();
    } else {
      await User.create(baseUserData);
    }

    await sendSignupOtpEmail(normalizedEmail, otp);

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email. Verify OTP to complete registration.",
        email: normalizedEmail,
      },
      { status: 200 }
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

    // Handle duplicate key error
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes("GMAIL_APP_PASSWORD")) {
      return NextResponse.json(
        {
          success: false,
          message: "Email service is not configured. Please set GMAIL_APP_PASSWORD.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
