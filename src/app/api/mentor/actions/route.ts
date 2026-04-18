import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";
import User from "@/src/models/user";

const VALID_ACTION_STATUSES = ["scheduled", "completed", "cancelled"] as const;
type ActionStatus = (typeof VALID_ACTION_STATUSES)[number];

/**
 * GET /api/mentor/actions?mentorId=xxx&studentId=xxx (optional)
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

    const studentId = request.nextUrl.searchParams.get("studentId");

    const query: Record<string, unknown> = { mentorId };
    if (studentId) query.studentId = studentId;

    const actions = await MentorAction.find(query).sort({ date: -1 }).lean();

    // Get student names
    const stuIds = [...new Set(actions.map((a) => a.studentId.toString()))];
    const students = await User.find({ _id: { $in: stuIds } }).select("fullName").lean();
    const nameMap = new Map(students.map((s) => [s._id.toString(), s.fullName]));

    // Get remarks
    const actionIds = actions.map((a) => a._id);
    const remarks = await MentorRemark.find({ actionId: { $in: actionIds } }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: actions.map((a) => ({
        id: a._id.toString(),
        studentId: a.studentId.toString(),
        studentName: nameMap.get(a.studentId.toString()) || "",
        actionType: a.actionType,
        description: a.description,
        date: a.date.toISOString(),
        status: a.status,
        outcome: a.outcome || "",
        remarks: remarks
          .filter((r) => r.actionId.toString() === a._id.toString())
          .map((r) => ({
            id: r._id.toString(),
            text: r.text,
            followUpDate: r.followUpDate?.toISOString() || null,
            createdAt: r.createdAt.toISOString(),
          })),
      })),
    });
  } catch (error) {
    console.error("Actions GET error:", error);
    return NextResponse.json({ success: false, message: "Failed to load actions" }, { status: 500 });
  }
}

/**
 * POST /api/mentor/actions — Create a new action
 * Body: { mentorId, studentId, actionType, description, date }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "mentor");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const { mentorId, studentId, actionType, description, date } = body;

    const scopedMentorId = resolveScopedUserId(auth.session.sub, mentorId);
    if (!scopedMentorId.ok) return scopedMentorId.response;
    const resolvedMentorId = scopedMentorId.userId;

    if (!studentId || !actionType || !description || !date) {
      return NextResponse.json({ success: false, message: "All fields required" }, { status: 400 });
    }

    const actionDate = new Date(date);
    if (Number.isNaN(actionDate.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid action date" }, { status: 400 });
    }

    const student = await User.findById(studentId).lean();
    if (!student || student.assignedMentorId !== resolvedMentorId) {
      return NextResponse.json({ success: false, message: "Student not assigned to you" }, { status: 403 });
    }

    const action = await MentorAction.create({
      mentorId: resolvedMentorId,
      studentId,
      actionType,
      description: description.trim(),
      date: actionDate,
      status: "scheduled",
    });

    return NextResponse.json({
      success: true,
      message: "Action created",
      data: { id: action._id.toString(), actionType, status: "scheduled" },
    });
  } catch (error) {
    console.error("Actions POST error:", error);
    return NextResponse.json({ success: false, message: "Failed to create action" }, { status: 500 });
  }
}

/**
 * PUT /api/mentor/actions — Update action status/outcome
 * Body: { actionId, mentorId, status?, outcome? }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "mentor");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as {
      actionId?: string;
      mentorId?: string;
      status?: ActionStatus;
      outcome?: string;
    };
    const { actionId, mentorId, status, outcome } = body;

    const scopedMentorId = resolveScopedUserId(auth.session.sub, mentorId);
    if (!scopedMentorId.ok) return scopedMentorId.response;
    const resolvedMentorId = scopedMentorId.userId;

    if (!actionId) {
      return NextResponse.json({ success: false, message: "actionId required" }, { status: 400 });
    }

    if (status && !VALID_ACTION_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid action status" }, { status: 400 });
    }

    const action = await MentorAction.findById(actionId).select("mentorId").lean();
    if (!action) {
      return NextResponse.json({ success: false, message: "Action not found" }, { status: 404 });
    }
    if (action.mentorId.toString() !== resolvedMentorId) {
      return NextResponse.json({ success: false, message: "Not authorized to update this action" }, { status: 403 });
    }

    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (typeof outcome === "string") update.outcome = outcome.trim();
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ success: false, message: "Nothing to update" }, { status: 400 });
    }

    await MentorAction.findByIdAndUpdate(actionId, update, { runValidators: true });

    return NextResponse.json({ success: true, message: "Action updated" });
  } catch (error) {
    console.error("Actions PUT error:", error);
    return NextResponse.json({ success: false, message: "Failed to update action" }, { status: 500 });
  }
}
