import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import Alert from "@/src/models/alert";
import User from "@/src/models/user";

/**
 * GET /api/mentor/alerts?mentorId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const mentorId = request.nextUrl.searchParams.get("mentorId");
    if (!mentorId) return NextResponse.json({ success: false, message: "mentorId required" }, { status: 400 });

    const alerts = await Alert.find({ mentorId }).sort({ sentAt: -1 }).lean();

    // Student names
    const stuIds = [...new Set(alerts.map((a) => a.studentId.toString()))];
    const students = await User.find({ _id: { $in: stuIds } }).select("fullName").lean();
    const nameMap = new Map(students.map((s) => [s._id.toString(), s.fullName]));

    return NextResponse.json({
      success: true,
      data: alerts.map((a) => ({
        id: a._id.toString(),
        studentId: a.studentId.toString(),
        studentName: nameMap.get(a.studentId.toString()) || "",
        type: a.type,
        priority: a.priority,
        title: a.title,
        message: a.message,
        status: a.status,
        sentAt: a.sentAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Alerts GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load alerts" }, { status: 500 });
  }
}

/**
 * PUT /api/mentor/alerts — Acknowledge alert
 * Body: { alertId, status }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { alertId, status } = body;

    if (!alertId || !status) return NextResponse.json({ success: false, message: "alertId and status required" }, { status: 400 });

    await Alert.findByIdAndUpdate(alertId, { status });
    return NextResponse.json({ success: true, message: "Alert updated" });
  } catch (error) {
    console.error("Alerts PUT error:", error);
    return NextResponse.json({ success: false, message: "Failed to update alert" }, { status: 500 });
  }
}
