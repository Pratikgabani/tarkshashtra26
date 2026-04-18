import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import { getSessionFromRequest } from "@/src/lib/session";
import Alert from "@/src/models/alert";

/**
 * PATCH /api/student/alerts/[id]
 * Body: { read: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "student") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid alert id" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as { read?: boolean };
    if (typeof body.read !== "boolean") {
      return NextResponse.json(
        { success: false, message: "read flag is required" },
        { status: 400 }
      );
    }

    const updated = await Alert.findOneAndUpdate(
      { _id: id, studentId: session.sub },
      {
        $set: {
          status: body.read ? "acknowledged" : "unread",
          readAt: body.read ? new Date() : null,
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated._id.toString(),
        status: updated.status,
        readAt: updated.readAt ? updated.readAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Student alert update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update alert" },
      { status: 500 }
    );
  }
}
