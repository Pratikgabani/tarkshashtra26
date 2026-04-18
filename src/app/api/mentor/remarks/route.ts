import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import MentorRemark from "@/src/models/mentorRemark";
import MentorAction from "@/src/models/mentorAction";

/**
 * POST /api/mentor/remarks — Add a remark/follow-up to an action
 * Body: { actionId, mentorId, studentId, text, followUpDate? }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { actionId, mentorId, studentId, text, followUpDate } = body;

    if (!actionId || !mentorId || !studentId || !text?.trim()) {
      return NextResponse.json({ success: false, message: "actionId, mentorId, studentId, and text are required" }, { status: 400 });
    }

    // Verify action exists
    const action = await MentorAction.findById(actionId).lean();
    if (!action || action.mentorId.toString() !== mentorId) {
      return NextResponse.json({ success: false, message: "Action not found" }, { status: 404 });
    }

    const remark = await MentorRemark.create({
      actionId,
      mentorId,
      studentId,
      text: text.trim(),
      followUpDate: followUpDate ? new Date(followUpDate) : undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Remark added",
      data: {
        id: remark._id.toString(),
        text: remark.text,
        followUpDate: remark.followUpDate?.toISOString() || null,
        createdAt: remark.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Remarks POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to add remark" }, { status: 500 });
  }
}
