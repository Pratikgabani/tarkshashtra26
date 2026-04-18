import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import Alert, { type AlertStatus } from "@/src/models/alert";
import User from "@/src/models/user";

const VALID_ALERT_STATUSES: AlertStatus[] = ["unread", "acknowledged", "actioned"];

/**
 * GET /api/mentor/alerts?mentorId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "mentor");
    if (!auth.ok) return auth.response;

    const scopedMentorId = resolveScopedUserId(
      auth.session.sub,
      request.nextUrl.searchParams.get("mentorId")
    );
    if (!scopedMentorId.ok) return scopedMentorId.response;
    const mentorId = scopedMentorId.userId;

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
 * Body: { alertId, mentorId, status }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "mentor");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      alertId?: string;
      mentorId?: string;
      status?: AlertStatus;
    };
    const { alertId, mentorId, status } = body;

    const scopedMentorId = resolveScopedUserId(auth.session.sub, mentorId);
    if (!scopedMentorId.ok) return scopedMentorId.response;
    const resolvedMentorId = scopedMentorId.userId;

    if (!alertId || !status) {
      return NextResponse.json({ success: false, message: "alertId and status required" }, { status: 400 });
    }
    if (!VALID_ALERT_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid alert status" }, { status: 400 });
    }

    const alert = await Alert.findById(alertId).select("mentorId").lean();
    if (!alert) {
      return NextResponse.json({ success: false, message: "Alert not found" }, { status: 404 });
    }
    if (!alert.mentorId || alert.mentorId.toString() !== resolvedMentorId) {
      return NextResponse.json({ success: false, message: "Not authorized to update this alert" }, { status: 403 });
    }

    const update: { status: AlertStatus; readAt?: Date } = { status };
    if (status === "acknowledged") update.readAt = new Date();
    if (status === "unread") update.readAt = undefined;

    await Alert.findByIdAndUpdate(alertId, update, { runValidators: true });
    return NextResponse.json({ success: true, message: "Alert updated" });
  } catch (error) {
    console.error("Alerts PUT error:", error);
    return NextResponse.json({ success: false, message: "Failed to update alert" }, { status: 500 });
  }
}
