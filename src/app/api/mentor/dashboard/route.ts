import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import User from "@/src/models/user";
import RiskScore from "@/src/models/riskScore";
import Alert from "@/src/models/alert";
import MentorAction from "@/src/models/mentorAction";

/**
 * GET /api/mentor/dashboard?mentorId=xxx
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

    const mentor = await User.findById(mentorId).lean();
    if (!mentor || mentor.role !== "mentor") return NextResponse.json({ success: false, message: "Mentor not found" }, { status: 404 });

    // Assigned students
    const students = await User.find({ assignedMentorId: mentorId, role: "student" }).lean();
    const studentIds = students.map((s) => s._id);

    // Latest risk score per student
    const riskScores = await RiskScore.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { calculatedAt: -1 } },
      { $group: { _id: "$studentId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);

    const riskMap = new Map(riskScores.map((r) => [r.studentId.toString(), r]));

    let low = 0, medium = 0, high = 0;
    for (const r of riskScores) {
      if (r.riskLevel === "low") low++;
      else if (r.riskLevel === "medium") medium++;
      else high++;
    }

    // Recent alerts
    const alerts = await Alert.find({ mentorId })
      .sort({ sentAt: -1 })
      .limit(10)
      .lean();

    const unreadAlerts = await Alert.countDocuments({ mentorId, status: "unread" });

    // Recent actions
    const recentActions = await MentorAction.find({ mentorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Build student list with risk
    const studentList = students.map((s) => {
      const risk = riskMap.get(s._id.toString());
      return {
        id: s._id.toString(),
        name: s.fullName,
        studentId: s.studentId,
        batch: s.batch,
        semester: s.semester,
        riskScore: risk?.score ?? 0,
        riskLevel: risk?.riskLevel ?? "low",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        mentor: { name: mentor.fullName, department: mentor.department, email: mentor.email },
        summary: {
          totalStudents: students.length,
          low, medium, high,
          unreadAlerts,
        },
        students: studentList.sort((a, b) => b.riskScore - a.riskScore),
        recentAlerts: alerts.map((a) => ({
          id: a._id.toString(),
          studentId: a.studentId.toString(),
          studentName: students.find((s) => s._id.toString() === a.studentId.toString())?.fullName || "",
          type: a.type,
          priority: a.priority,
          title: a.title,
          message: a.message,
          status: a.status,
          sentAt: a.sentAt.toISOString(),
        })),
        recentActions: recentActions.map((a) => ({
          id: a._id.toString(),
          studentId: a.studentId.toString(),
          studentName: students.find((s) => s._id.toString() === a.studentId.toString())?.fullName || "",
          actionType: a.actionType,
          description: a.description,
          date: a.date.toISOString(),
          status: a.status,
        })),
      },
    });
  } catch (error) {
    console.error("Mentor dashboard error:", error);
    return NextResponse.json({ success: false, message: "Failed to load dashboard" }, { status: 500 });
  }
}
