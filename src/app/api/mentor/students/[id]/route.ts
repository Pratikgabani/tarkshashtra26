import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import User from "@/src/models/user";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import StudentAssignment from "@/src/models/studentAssignment";
import RiskScore from "@/src/models/riskScore";
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";
import { ensureLatestRiskScores } from "@/src/lib/riskScorePredictor";

interface PopulatedAssignmentRef {
  title?: string;
  maxMarks?: number;
  dueDate?: Date;
}

interface InterventionComparison {
  actionId: string;
  actionType: string;
  actionDate: string;
  before: {
    score: number;
    riskLevel: string;
    calculatedAt: string;
  };
  after: {
    score: number;
    riskLevel: string;
    calculatedAt: string;
  };
  delta: number;
  trend: "improved" | "worsened" | "unchanged";
}

/**
 * GET /api/mentor/students/[id]?mentorId=xxx
 * Full student detail for mentor view.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "mentor");
    if (!auth.ok) return auth.response;

    const { id: studentId } = await params;
    const scopedMentorId = resolveScopedUserId(
      auth.session.sub,
      request.nextUrl.searchParams.get("mentorId")
    );
    if (!scopedMentorId.ok) return scopedMentorId.response;
    const mentorId = scopedMentorId.userId;

    const student = await User.findById(studentId).lean();
    if (!student || student.role !== "student" || student.assignedMentorId !== mentorId) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
    }

    await ensureLatestRiskScores([student._id], {
      forceRefresh: true,
      maxAgeMinutes: 0,
    });

    // Risk scores history
    const riskHistory = await RiskScore.find({ studentId })
      .sort({ calculatedAt: 1 })
      .lean();

    const latestRisk = riskHistory.length > 0 ? riskHistory[riskHistory.length - 1] : null;

    // Attendance per subject
    const attAgg = await Attendance.aggregate([
      { $match: { studentId: student._id } },
      {
        $group: {
          _id: "$subjectId",
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        },
      },
      {
        $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "subject" },
      },
      { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
    ]);

    const attendance = attAgg.map((a) => ({
      subjectName: a.subject?.name || "Unknown",
      total: a.total,
      present: a.present,
      percentage: Math.round((a.present / a.total) * 100),
    }));

    const overallAttendance = attAgg.length > 0
      ? Math.round(attAgg.reduce((s, a) => s + a.present, 0) / attAgg.reduce((s, a) => s + a.total, 0) * 100)
      : 0;

    // Assessments
    const assessments = await Assessment.find({ studentId: student._id })
      .populate("subjectId", "name code")
      .sort({ date: 1 })
      .lean();

    const marksAgg = await Assessment.aggregate([
      { $match: { studentId: student._id } },
      { $group: { _id: null, totalObtained: { $sum: "$marksObtained" }, totalMax: { $sum: "$maxMarks" } } },
    ]);
    const overallMarks = marksAgg.length > 0
      ? Math.round((marksAgg[0].totalObtained / marksAgg[0].totalMax) * 100)
      : 0;

    // Assignments
    const studentSubs = await StudentAssignment.find({ studentId: student._id })
      .populate("assignmentId")
      .lean();

    const assignmentData = studentSubs.map((sa) => {
      const a = sa.assignmentId as unknown as PopulatedAssignmentRef;
      return {
        title: a?.title || "",
        status: sa.status,
        marksObtained: sa.marksObtained,
        maxMarks: a?.maxMarks || 0,
        dueDate: a?.dueDate?.toISOString() || "",
      };
    });

    const completedAssignments = assignmentData.filter(
      (a) => a.status === "submitted_on_time" || a.status === "submitted_late"
    ).length;

    // Actions
    const actions = await MentorAction.find({ studentId, mentorId })
      .sort({ date: -1 })
      .lean();

    // Remarks
    const actionIds = actions.map((a) => a._id);
    const remarks = await MentorRemark.find({ actionId: { $in: actionIds } })
      .sort({ createdAt: -1 })
      .lean();

    const interventionComparison = actions
      .map((action): InterventionComparison | null => {
        const actionDate = new Date(action.date);
        const before = [...riskHistory]
          .reverse()
          .find((entry) => entry.calculatedAt <= actionDate);
        const after = riskHistory.find((entry) => entry.calculatedAt > actionDate);

        if (!before || !after) return null;

        const delta = Math.round((after.score - before.score) * 100) / 100;
        const trend: InterventionComparison["trend"] =
          delta < 0 ? "improved" : delta > 0 ? "worsened" : "unchanged";

        return {
          actionId: action._id.toString(),
          actionType: action.actionType,
          actionDate: actionDate.toISOString(),
          before: {
            score: before.score,
            riskLevel: before.riskLevel,
            calculatedAt: before.calculatedAt.toISOString(),
          },
          after: {
            score: after.score,
            riskLevel: after.riskLevel,
            calculatedAt: after.calculatedAt.toISOString(),
          },
          delta,
          trend,
        };
      })
      .filter((entry): entry is InterventionComparison => entry !== null);

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student._id.toString(),
          name: student.fullName,
          email: student.email,
          studentId: student.studentId,
          batch: student.batch,
          semester: student.semester,
          department: student.department,
        },
        risk: latestRisk ? {
          score: latestRisk.score,
          riskLevel: latestRisk.riskLevel,
          factors: latestRisk.factors,
          calculatedAt: latestRisk.calculatedAt.toISOString(),
        } : null,
        riskHistory: riskHistory.map((r) => ({
          score: r.score,
          riskLevel: r.riskLevel,
          date: r.calculatedAt.toISOString(),
        })),
        overallStats: {
          attendance: overallAttendance,
          marks: overallMarks,
          assignmentsCompleted: completedAssignments,
          totalAssignments: assignmentData.length,
        },
        attendance,
        assessments: assessments.map((a) => ({
          subject: (a.subjectId as unknown as { name: string })?.name || "",
          type: a.assessmentType,
          marksObtained: a.marksObtained,
          maxMarks: a.maxMarks,
          date: a.date.toISOString(),
        })),
        assignments: assignmentData,
        actions: actions.map((a) => ({
          id: a._id.toString(),
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
        interventionComparison,
      },
    });
  } catch (error) {
    console.error("Student detail error:", error);
    return NextResponse.json({ success: false, message: "Failed to load student" }, { status: 500 });
  }
}
