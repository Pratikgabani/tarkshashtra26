import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";
import User from "@/src/models/user";

/**
 * GET /api/mentor/actions?mentorId=xxx&studentId=xxx (optional)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const mentorId = request.nextUrl.searchParams.get("mentorId");
    const studentId = request.nextUrl.searchParams.get("studentId");
    if (!mentorId) return NextResponse.json({ success: false, message: "mentorId required" }, { status: 400 });

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
    const body = await request.json();
    const { mentorId, studentId, actionType, description, date } = body;

    if (!mentorId || !studentId || !actionType || !description || !date) {
      return NextResponse.json({ success: false, message: "All fields required" }, { status: 400 });
    }

    const student = await User.findById(studentId).lean();
    if (!student || student.assignedMentorId !== mentorId) {
      return NextResponse.json({ success: false, message: "Student not assigned to you" }, { status: 403 });
    }

    const action = await MentorAction.create({
      mentorId,
      studentId,
      actionType,
      description: description.trim(),
      date: new Date(date),
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
 * Body: { actionId, status?, outcome? }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { actionId, status, outcome } = body;

    if (!actionId) return NextResponse.json({ success: false, message: "actionId required" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (outcome) update.outcome = outcome;

    await MentorAction.findByIdAndUpdate(actionId, update);

    return NextResponse.json({ success: true, message: "Action updated" });
  } catch (error) {
    console.error("Actions PUT error:", error);
    return NextResponse.json({ success: false, message: "Failed to update action" }, { status: 500 });
  }
}
