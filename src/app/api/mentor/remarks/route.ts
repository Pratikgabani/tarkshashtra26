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
    const body = (await request.json()) as {
      actionId?: string;
      mentorId?: string;
      studentId?: string;
      text?: string;
      followUpDate?: string;
    };
    const { actionId, mentorId, studentId, text, followUpDate } = body;

    if (!actionId || !mentorId || !studentId || !text?.trim()) {
      return NextResponse.json({ success: false, message: "actionId, mentorId, studentId, and text are required" }, { status: 400 });
    }

    // Verify action exists
    const action = await MentorAction.findById(actionId).lean();
    if (!action || action.mentorId.toString() !== mentorId) {
      return NextResponse.json({ success: false, message: "Action not found" }, { status: 404 });
    }
    if (action.studentId.toString() !== studentId) {
      return NextResponse.json({ success: false, message: "Student does not match the action" }, { status: 403 });
    }

    let parsedFollowUpDate: Date | undefined;
    if (followUpDate) {
      const parsed = new Date(followUpDate);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ success: false, message: "Invalid follow-up date" }, { status: 400 });
      }
      parsedFollowUpDate = parsed;
    }

    const remark = await MentorRemark.create({
      actionId,
      mentorId,
      studentId: action.studentId,
      text: text.trim(),
      followUpDate: parsedFollowUpDate,
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
