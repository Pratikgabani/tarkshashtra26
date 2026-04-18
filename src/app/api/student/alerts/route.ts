import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { getSessionFromRequest } from "@/src/lib/session";
import Alert from "@/src/models/alert";

/**
 * GET /api/student/alerts
 * PATCH /api/student/alerts  { action: "mark_all_read" }
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "student") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const status = (request.nextUrl.searchParams.get("status") || "all").trim().toLowerCase();
    const query: Record<string, unknown> = { studentId: session.sub };

    if (status === "unread") query.status = "unread";
    if (status === "acknowledged") query.status = "acknowledged";
    if (status === "actioned") query.status = "actioned";

    const alerts = await Alert.find(query)
      .sort({ sentAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        alerts: alerts.map((alert) => ({
          id: alert._id.toString(),
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          status: alert.status,
          sentAt: alert.sentAt.toISOString(),
          readAt: alert.readAt ? alert.readAt.toISOString() : null,
          actionLink: alert.actionLink,
        })),
      },
    });
  } catch (error) {
    console.error("Student alerts list error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "student") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { action?: string };
    if (body.action !== "mark_all_read") {
      return NextResponse.json(
        { success: false, message: "Unsupported action" },
        { status: 400 }
      );
    }

    await Alert.updateMany(
      { studentId: session.sub, status: "unread" },
      {
        $set: {
          status: "acknowledged",
          readAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student mark-all-read error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update alerts" },
      { status: 500 }
    );
  }
}
