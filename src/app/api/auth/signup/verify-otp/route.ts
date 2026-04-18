import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import { hashOtp } from "@/src/lib/otp";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = (await request.json()) as {
      email?: string;
      otp?: string;
    };

    const email = body.email?.toLowerCase().trim();
    const otp = body.otp?.trim();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, message: "OTP must be a 6-digit number" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No pending signup found for this email" },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, message: "This email is already verified" },
        { status: 409 }
      );
    }

    if (!user.signupOtpHash || !user.signupOtpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "OTP not found. Please request a new OTP." },
        { status: 400 }
      );
    }

    if (user.signupOtpExpiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, message: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const providedOtpHash = Buffer.from(hashOtp(otp), "utf8");
    const storedOtpHash = Buffer.from(user.signupOtpHash, "utf8");
    const isOtpValid =
      providedOtpHash.length === storedOtpHash.length &&
      timingSafeEqual(providedOtpHash, storedOtpHash);

    if (!isOtpValid) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP" },
        { status: 400 }
      );
    }

    user.isEmailVerified = true;
    user.signupOtpHash = undefined;
    user.signupOtpExpiresAt = undefined;
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Email verified and account created successfully",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          ...(user.role === "student" && {
            studentId: user.studentId,
            semester: user.semester,
            batch: user.batch,
          }),
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
