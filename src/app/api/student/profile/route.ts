import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import { createSessionToken, setSessionCookie } from "@/src/lib/session";
import User from "@/src/models/user";

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

/**
 * PATCH /api/student/profile
 * Body: { fullName?: string, email?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "student");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as { fullName?: unknown; email?: unknown };

    const fullNameInput = normalizeString(body.fullName);
    const emailInputRaw = normalizeString(body.email);
    const emailInput = emailInputRaw ? emailInputRaw.toLowerCase() : null;

    if (!fullNameInput && !emailInput) {
      return NextResponse.json(
        { success: false, message: "At least one field is required" },
        { status: 400 }
      );
    }

    if (fullNameInput && (fullNameInput.length < 2 || fullNameInput.length > 100)) {
      return NextResponse.json(
        { success: false, message: "Full name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    if (emailInput && !isValidEmail(emailInput)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const student = await User.findById(auth.session.sub);
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    if (emailInput && emailInput !== student.email) {
      const duplicate = await User.findOne({ email: emailInput }).select("_id").lean();
      if (duplicate) {
        return NextResponse.json(
          { success: false, message: "Email is already in use" },
          { status: 409 }
        );
      }
      student.email = emailInput;
    }

    if (fullNameInput) {
      student.fullName = fullNameInput;
    }

    await student.save();

    const nextSessionToken = createSessionToken({
      userId: student._id.toString(),
      role: student.role,
      email: student.email,
    });

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        fullName: student.fullName,
        email: student.email,
      },
    });

    setSessionCookie(response, nextSessionToken);
    return response;
  } catch (error) {
    console.error("Student profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
