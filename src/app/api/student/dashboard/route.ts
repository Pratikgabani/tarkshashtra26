import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import Subject from "@/src/models/subject";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import LmsActivity from "@/src/models/lmsActivity";
import RiskScore from "@/src/models/riskScore";
import Alert from "@/src/models/alert";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "studentId query parameter is required" },
        { status: 400 }
      );
    }

    // --- Fetch student ---
    const student = await User.findById(studentId).lean();
    if (!student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    // --- Fetch subjects for the student's semester & department ---
    const subjects = await Subject.find({
      department: student.department,
      semester: student.semester,
    }).lean();

    const subjectIds = subjects.map((s) => s._id);

    // --- Attendance per subject ---
    const attendance = await Attendance.find({
      studentId: student._id,
      subjectId: { $in: subjectIds },
    }).lean();

    const attendanceBySubject: Record<string, { present: number; total: number }> = {};
    let totalPresent = 0;
    let totalClasses = 0;

    for (const record of attendance) {
      const sid = record.subjectId.toString();
      if (!attendanceBySubject[sid]) {
        attendanceBySubject[sid] = { present: 0, total: 0 };
      }
      attendanceBySubject[sid].total++;
      totalClasses++;
      if (record.status === "present" || record.status === "late") {
        attendanceBySubject[sid].present++;
        totalPresent++;
      }
    }

    const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

    // --- Assessments per subject ---
    const assessments = await Assessment.find({
      studentId: student._id,
      subjectId: { $in: subjectIds },
    })
      .sort({ date: 1 })
      .lean();

    const assessmentsBySubject: Record<string, Array<{
      type: string; marksObtained: number; maxMarks: number; date: string;
    }>> = {};

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    for (const a of assessments) {
      const sid = a.subjectId.toString();
      if (!assessmentsBySubject[sid]) assessmentsBySubject[sid] = [];
      assessmentsBySubject[sid].push({
        type: a.assessmentType,
        marksObtained: a.marksObtained,
        maxMarks: a.maxMarks,
        date: a.date.toISOString(),
      });
      totalMarksObtained += a.marksObtained;
      totalMaxMarks += a.maxMarks;
    }

    const overallMarksPercent = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

    // --- Assignments ---
    const assignments = await Assignment.find({
      subjectId: { $in: subjectIds },
    }).lean();

    const assignmentIds = assignments.map((a) => a._id);

    const studentAssignments = await StudentAssignment.find({
      studentId: student._id,
      assignmentId: { $in: assignmentIds },
    }).lean();

    const assignmentMap = new Map(assignments.map((a) => [a._id.toString(), a]));

    const assignmentsBySubject: Record<string, Array<{
      title: string; status: string; dueDate: string; marksObtained: number | null; maxMarks: number;
    }>> = {};

    let totalAssignments = 0;
    let submittedAssignments = 0;
    let lateSubmissions = 0;
    const pendingAssignments: Array<{
      title: string; subjectName: string; dueDate: string; maxMarks: number;
    }> = [];

    for (const sa of studentAssignments) {
      const assignment = assignmentMap.get(sa.assignmentId.toString());
      if (!assignment) continue;

      const sid = assignment.subjectId.toString();
      const subjectName = subjects.find((s) => s._id.toString() === sid)?.name || "Unknown";

      if (!assignmentsBySubject[sid]) assignmentsBySubject[sid] = [];

      assignmentsBySubject[sid].push({
        title: assignment.title,
        status: sa.status,
        dueDate: assignment.dueDate.toISOString(),
        marksObtained: sa.marksObtained,
        maxMarks: assignment.maxMarks,
      });

      totalAssignments++;
      if (sa.status === "submitted_on_time" || sa.status === "submitted_late") {
        submittedAssignments++;
      }
      if (sa.status === "submitted_late") lateSubmissions++;
      if (sa.status === "not_submitted") {
        pendingAssignments.push({
          title: assignment.title,
          subjectName,
          dueDate: assignment.dueDate.toISOString(),
          maxMarks: assignment.maxMarks,
        });
      }
    }

    const assignmentCompletionRate = totalAssignments > 0
      ? Math.round((submittedAssignments / totalAssignments) * 100) : 0;

    // --- LMS Activity (last 7 days) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLms = await LmsActivity.find({
      studentId: student._id,
      date: { $gte: sevenDaysAgo },
    }).lean();

    const weeklyLogins = recentLms.reduce((sum, r) => sum + r.loginCount, 0);
    const avgLoginsPerWeek = Math.round(weeklyLogins * 10) / 10;

    // --- Risk Score (call dummy/external API) ---
    let riskData;
    try {
      const origin = request.headers.get("host") || "localhost:3000";
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const riskRes = await fetch(`${protocol}://${origin}/api/risk-score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });
      const riskJson = await riskRes.json();
      riskData = riskJson.data;
    } catch {
      // Fallback - use latest from DB
      const latestRisk = await RiskScore.findOne({ studentId: student._id })
        .sort({ calculatedAt: -1 })
        .lean();
      riskData = latestRisk;
    }

    // --- Risk History ---
    const riskHistory = await RiskScore.find({ studentId: student._id })
      .sort({ calculatedAt: 1 })
      .lean();

    // --- Alerts ---
    const alerts = await Alert.find({ studentId: student._id })
      .sort({ sentAt: -1 })
      .limit(10)
      .lean();

    // --- Build subject performance cards ---
    const subjectPerformance = subjects.map((subject) => {
      const sid = subject._id.toString();
      const att = attendanceBySubject[sid] || { present: 0, total: 0 };
      const attPercent = att.total > 0 ? Math.round((att.present / att.total) * 100) : 0;

      const subjectAssessments = assessmentsBySubject[sid] || [];
      const subAssignments = assignmentsBySubject[sid] || [];
      const submitted = subAssignments.filter(
        (a) => a.status === "submitted_on_time" || a.status === "submitted_late"
      ).length;
      const completionRate = subAssignments.length > 0
        ? Math.round((submitted / subAssignments.length) * 100) : 0;

      const totalObtained = subjectAssessments.reduce((s, a) => s + a.marksObtained, 0);
      const totalMax = subjectAssessments.reduce((s, a) => s + a.maxMarks, 0);
      const marksPercent = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

      return {
        subjectId: sid,
        name: subject.name,
        code: subject.code,
        attendance: attPercent,
        marksPercent,
        completionRate,
        assessments: subjectAssessments,
        assignments: subAssignments,
      };
    });

    // --- Motivational message based on risk level ---
    const riskLevel = riskData?.riskLevel || "medium";
    const motivationalMessage =
      riskLevel === "low"
        ? "Great work! Keep maintaining your performance."
        : riskLevel === "medium"
        ? "You're doing okay, but there's room for improvement. Stay focused!"
        : riskLevel === "high"
        ? "You have the ability to improve. Focus on attendance and pending assignments first."
        : "Immediate action required. Reach out to your mentor for support.";

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student._id,
          fullName: student.fullName,
          email: student.email,
          studentId: student.studentId,
          department: student.department,
          semester: student.semester,
          batch: student.batch,
        },
        riskScore: riskData,
        motivationalMessage,
        overallStats: {
          attendance: overallAttendance,
          marksPercent: overallMarksPercent,
          assignmentCompletionRate,
          lateSubmissions,
          avgLoginsPerWeek,
          pendingAssignmentCount: pendingAssignments.length,
        },
        subjectPerformance,
        pendingAssignments,
        riskHistory: riskHistory.map((r) => ({
          score: r.score,
          riskLevel: r.riskLevel,
          date: r.calculatedAt.toISOString(),
        })),
        alerts: alerts.map((a) => ({
          id: a._id,
          type: a.type,
          priority: a.priority,
          title: a.title,
          message: a.message,
          status: a.status,
          sentAt: a.sentAt.toISOString(),
          actionLink: a.actionLink,
        })),
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
