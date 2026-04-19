import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import { getSessionFromRequest } from "@/src/lib/session";
import User from "@/src/models/user";
import Subject from "@/src/models/subject";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import LmsActivity from "@/src/models/lmsActivity";
import RiskScore from "@/src/models/riskScore";
import Alert from "@/src/models/alert";
import MentorAction from "@/src/models/mentorAction";
import { ensureLatestRiskScores } from "@/src/lib/riskScorePredictor";

type SubmissionStatus = "submitted_on_time" | "submitted_late" | "not_submitted";

interface StudentDashboardRiskFactor {
  factor: string;
  label: string;
  currentValue: number;
  threshold: number;
  unit: string;
  weight: number;
  contribution: number;
  suggestion: string;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildDashboardRiskFactors(metrics: {
  attendance: number;
  marks: number;
  assignmentCompletionRate: number;
  avgLoginsPerWeek: number;
  lateSubmissions: number;
}): StudentDashboardRiskFactor[] {
  const attendance = clampPercentage(metrics.attendance);
  const marks = clampPercentage(metrics.marks);
  const assignmentCompletionRate = clampPercentage(metrics.assignmentCompletionRate);
  const avgLoginsPerWeek = Number.isFinite(metrics.avgLoginsPerWeek)
    ? Number(metrics.avgLoginsPerWeek.toFixed(1))
    : 0;
  const lmsScore = clampPercentage((avgLoginsPerWeek / 5) * 100);
  const lateSubmissions = Math.max(0, Math.round(metrics.lateSubmissions));

  const attendanceDeficit = Math.max(0, (75 - attendance) / 75);
  const marksDeficit = Math.max(0, (40 - marks) / 40);
  const assignmentDeficit = Math.max(0, (80 - assignmentCompletionRate) / 80);
  const lmsDeficit = Math.max(0, (60 - lmsScore) / 60);
  const lateSubmissionDeficit = Math.min(1, lateSubmissions / 5);

  return [
    {
      factor: "attendance",
      label: "Attendance",
      currentValue: attendance,
      threshold: 75,
      unit: "%",
      weight: 0.3,
      contribution: Math.round(attendanceDeficit * 30),
      suggestion:
        attendance < 75
          ? "Increase class attendance to at least 75%."
          : "Attendance is healthy. Keep it consistent.",
    },
    {
      factor: "assessment_marks",
      label: "Internal Assessment Marks",
      currentValue: marks,
      threshold: 40,
      unit: "%",
      weight: 0.25,
      contribution: Math.round(marksDeficit * 25),
      suggestion:
        marks < 40
          ? "Focus on low-scoring subjects and weekly revision."
          : "Assessment performance is stable.",
    },
    {
      factor: "assignment_completion",
      label: "Assignment Completion",
      currentValue: assignmentCompletionRate,
      threshold: 80,
      unit: "%",
      weight: 0.2,
      contribution: Math.round(assignmentDeficit * 20),
      suggestion:
        assignmentCompletionRate < 80
          ? "Complete pending assignments before upcoming deadlines."
          : "Assignm ent completion is strong.",
    },
    {
      factor: "lms_activity",
      label: "LMS Activity",
      currentValue: avgLoginsPerWeek,
      threshold: 3,
      unit: "logins/week",
      weight: 0.15,
      contribution: Math.round(lmsDeficit * 15),
      suggestion:
        avgLoginsPerWeek < 3
          ? "Use LMS more often for resources and announcements."
          : "LMS engagement is good.",
    },
    {
      factor: "submission_timeliness",
      label: "Submission Timeliness",
      currentValue: lateSubmissions,
      threshold: 2,
      unit: "late submissions",
      weight: 0.1,
      contribution: Math.round(lateSubmissionDeficit * 10),
      suggestion:
        lateSubmissions > 2
          ? "Reduce late submissions by planning work ahead."
          : "Submission timing is acceptable.",
    },
  ].sort((a, b) => b.contribution - a.contribution);
}

function resolveStudentActionLink(type: string, rawLink?: string): string {
  const link = (rawLink || "").trim();

  if (link.startsWith("/student/")) {
    return link;
  }

  if (type === "teacher_flag" || type === "meeting_request") {
    return "/student/profile";
  }

  if (type === "risk_threshold_crossed") {
    return "/student/dashboard";
  }

  return "/student/dashboard";
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId")?.trim();
    const studentId = requestedStudentId || session.sub;

    if (requestedStudentId && requestedStudentId !== session.sub) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid studentId format" },
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

    const mentor = student.assignedMentorId
      ? await User.findById(student.assignedMentorId)
          .select("_id fullName email role")
          .lean()
      : null;

    // --- Fetch subjects for the student's semester & department ---
    const subjects = await Subject.find({
      department: student.department,
      semester: student.semester,
    }).lean();

    const subjectIds = subjects.map((s) => s._id);
    const subjectNameById = new Map(subjects.map((s) => [s._id.toString(), s.name]));

    const teacherIds = Array.from(
      new Set(
        subjects
          .map((subject) => subject.teacherId?.toString())
          .filter((id): id is string => Boolean(id))
      )
    );

    const teacherDocs = teacherIds.length > 0
      ? await User.find({ _id: { $in: teacherIds }, role: "teacher" })
          .select("_id fullName email")
          .lean()
      : [];

    const teacherById = new Map(
      teacherDocs.map((teacher) => [teacher._id.toString(), teacher])
    );

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

    const studentAssignmentMap = new Map(
      studentAssignments.map((sa) => [sa.assignmentId.toString(), sa])
    );

    const assignmentsBySubject: Record<string, Array<{
      assignmentId: string;
      title: string;
      status: string;
      dueDate: string;
      marksObtained: number | null;
      maxMarks: number;
      assignmentFileUrl: string | null;
      assignmentFileName: string | null;
    }>> = {};

    let totalAssignments = 0;
    let submittedAssignments = 0;
    let lateSubmissions = 0;
    const pendingAssignments: Array<{
      assignmentId: string;
      subjectId: string;
      title: string;
      subjectName: string;
      dueDate: string;
      maxMarks: number;
      assignmentFileUrl: string | null;
      assignmentFileName: string | null;
    }> = [];

    for (const assignment of assignments) {
      const assignmentId = assignment._id.toString();
      const submission = studentAssignmentMap.get(assignmentId);
      const status: SubmissionStatus = submission?.status ?? "not_submitted";
      const marksObtained = submission?.marksObtained ?? null;

      const sid = assignment.subjectId.toString();
      const subjectName = subjectNameById.get(sid) || "Unknown";

      if (!assignmentsBySubject[sid]) assignmentsBySubject[sid] = [];

      assignmentsBySubject[sid].push({
        assignmentId,
        title: assignment.title,
        status,
        dueDate: assignment.dueDate.toISOString(),
        marksObtained,
        maxMarks: assignment.maxMarks,
        assignmentFileUrl: assignment.attachmentUrl ?? null,
        assignmentFileName: assignment.attachmentOriginalName ?? null,
      });

      totalAssignments++;
      if (status === "submitted_on_time" || status === "submitted_late") {
        submittedAssignments++;
      }
      if (status === "submitted_late") lateSubmissions++;
      if (status === "not_submitted") {
        pendingAssignments.push({
          assignmentId,
          subjectId: sid,
          title: assignment.title,
          subjectName,
          dueDate: assignment.dueDate.toISOString(),
          maxMarks: assignment.maxMarks,
          assignmentFileUrl: assignment.attachmentUrl ?? null,
          assignmentFileName: assignment.attachmentOriginalName ?? null,
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

    const dashboardRiskFactors = buildDashboardRiskFactors({
      attendance: overallAttendance,
      marks: overallMarksPercent,
      assignmentCompletionRate,
      avgLoginsPerWeek,
      lateSubmissions,
    });

    // --- Risk Score ---
    let riskData: {
      studentId: string;
      score: number;
      riskLevel: "low" | "medium" | "high";
      factors: StudentDashboardRiskFactor[];
      calculatedAt: string;
    } | null = null;

    const latestRiskMap = await ensureLatestRiskScores([student._id], {
      forceRefresh: true,
      maxAgeMinutes: 0,
    });

    const latestPredictedRisk = latestRiskMap.get(student._id.toString());
    if (latestPredictedRisk) {
      riskData = {
        studentId,
        score: latestPredictedRisk.score,
        riskLevel: latestPredictedRisk.riskLevel,
        factors: dashboardRiskFactors,
        calculatedAt: latestPredictedRisk.calculatedAt.toISOString(),
      };
    }

    if (!riskData) {
      riskData = {
        studentId,
        score: 0,
        riskLevel: "low",
        factors: dashboardRiskFactors,
        calculatedAt: new Date().toISOString(),
      };
    }

    // --- Risk History ---
    const riskHistory = await RiskScore.find({ studentId: student._id })
      .sort({ calculatedAt: 1 })
      .lean();

    const interventionActions = await MentorAction.find({ studentId: student._id })
      .select("date")
      .lean();

    const interventionDays = new Set(
      interventionActions.map((action) => new Date(action.date).toISOString().slice(0, 10))
    );

    // --- Alerts ---
    const alerts = await Alert.find({ studentId: student._id })
      .sort({ sentAt: -1 })
      .limit(10)
      .lean();

    const unreadAlertCount = alerts.filter((alert) => alert.status === "unread").length;

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
        faculty: teacherById.get(subject.teacherId?.toString() || "")?.fullName || "Faculty Not Assigned",
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
        : "You have the ability to improve. Focus on attendance and pending assignments first.";

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student._id.toString(),
          fullName: student.fullName,
          email: student.email,
          studentId: student.studentId,
          department: student.department,
          semester: student.semester,
          batch: student.batch,
          mentor: student.assignedMentorId
            ? {
                id: student.assignedMentorId,
                fullName: mentor?.fullName || "Mentor",
                email: mentor?.email || "",
              }
            : null,
        },
        riskScore: riskData,
        motivationalMessage,
        overallStats: {
          attendance: overallAttendance,
          marksPercent: overallMarksPercent,
          assignmentCompletionRate,
          lateSubmissions,
          avgLoginsPerWeek,
          pendingAssignments: pendingAssignments.length,
          pendingAssignmentCount: pendingAssignments.length,
        },
        subjectPerformance,
        pendingAssignments,
        riskHistory: riskHistory.map((r) => ({
          score: r.score,
          riskLevel: r.riskLevel,
          date: r.calculatedAt.toISOString(),
          intervention: interventionDays.has(r.calculatedAt.toISOString().slice(0, 10)),
        })),
        alerts: alerts.map((a) => ({
          id: a._id.toString(),
          type: a.type,
          priority: a.priority,
          title: a.title,
          message: a.message,
          status: a.status,
          sentAt: a.sentAt.toISOString(),
          actionLink: resolveStudentActionLink(a.type, a.actionLink),
        })),
        unreadAlertCount,
        generatedAt: new Date().toISOString(),
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
