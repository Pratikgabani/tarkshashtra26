import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import MentorAction from "@/src/models/mentorAction";
import Alert from "@/src/models/alert";
import User from "@/src/models/user";

/**
 * POST /api/student/mentor-meeting
 * Creates a scheduled counseling request for the assigned mentor.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "student");
    if (!auth.ok) return auth.response;

    const student = await User.findById(auth.session.sub)
      .select("_id role fullName assignedMentorId")
      .lean();

    if (!student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const mentorId = student.assignedMentorId?.trim();
    if (!mentorId) {
      return NextResponse.json(
        { success: false, message: "No mentor is assigned to your profile" },
        { status: 400 }
      );
    }

    const mentor = await User.findById(mentorId)
      .select("_id role fullName")
      .lean();

    if (!mentor || mentor.role !== "mentor") {
      return NextResponse.json(
        { success: false, message: "Assigned mentor could not be found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const recentWindow = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const existingRequest = await MentorAction.findOne({
      mentorId: mentor._id,
      studentId: student._id,
      actionType: "counseling",
      status: "scheduled",
      createdAt: { $gte: recentWindow },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existingRequest) {
      return NextResponse.json({
        success: true,
        message: "A meeting request was already sent recently.",
        data: {
          actionId: existingRequest._id.toString(),
          requestedAt: existingRequest.createdAt.toISOString(),
        },
      });
    }

    const suggestedDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    const action = await MentorAction.create({
      mentorId: mentor._id,
      studentId: student._id,
      actionType: "counseling",
      description: `Student meeting request from ${student.fullName}`,
      date: suggestedDate,
      status: "scheduled",
    });

    await Alert.create({
      studentId: student._id,
      mentorId: mentor._id,
      type: "meeting_request",
      priority: "medium",
      title: "Meeting request sent",
      message: `Your meeting request has been sent to ${mentor.fullName}.`,
      actionLink: "/student/profile",
      status: "unread",
      sentAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Meeting request sent to your mentor",
      data: {
        actionId: action._id.toString(),
        requestedAt: now.toISOString(),
        scheduledFor: suggestedDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Student mentor meeting request error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send meeting request" },
      { status: 500 }
    );
  }
}
