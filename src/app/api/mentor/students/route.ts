import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import User from "@/src/models/user";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import RiskScore from "@/src/models/riskScore";
import Subject from "@/src/models/subject";

const VALID_RISK_FILTERS = new Set(["all", "low", "medium", "high"]);

/**
 * GET /api/mentor/students?mentorId=xxx&risk=high&search=arjun
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

    const riskFilter = (request.nextUrl.searchParams.get("risk") || "all").trim().toLowerCase();
    const search = request.nextUrl.searchParams.get("search");
    const batch = request.nextUrl.searchParams.get("batch");
    const semester = request.nextUrl.searchParams.get("semester");
    const subject = request.nextUrl.searchParams.get("subject");
    const sanitizedBatch = batch?.trim();
    const sanitizedSubject = subject?.trim();

    if (!VALID_RISK_FILTERS.has(riskFilter)) {
      return NextResponse.json({ success: false, message: "Invalid risk filter" }, { status: 400 });
    }

    if (sanitizedBatch && !/^[A-Za-z0-9-]{1,20}$/.test(sanitizedBatch)) {
      return NextResponse.json({ success: false, message: "Invalid batch filter" }, { status: 400 });
    }

    let sanitizedSemester: number | undefined;
    if (semester?.trim()) {
      const parsedSemester = Number(semester);
      if (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 8) {
        return NextResponse.json({ success: false, message: "Invalid semester filter" }, { status: 400 });
      }
      sanitizedSemester = parsedSemester;
    }

    // Build student query
    const query: Record<string, unknown> = { assignedMentorId: mentorId, role: "student" };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.fullName = { $regex: escapedSearch, $options: "i" };
    }
    if (sanitizedBatch) query.batch = sanitizedBatch;
    if (sanitizedSemester !== undefined) query.semester = sanitizedSemester;

    const students = await User.find(query).lean();

    let filteredStudents = students;
    if (sanitizedSubject) {
      const matchedSubjectIds = new Set<string>();

      if (mongoose.Types.ObjectId.isValid(sanitizedSubject)) {
        matchedSubjectIds.add(sanitizedSubject);
      }

      const escapedSubject = sanitizedSubject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingSubjects = await Subject.find(
        {
          $or: [
            { name: { $regex: `^${escapedSubject}$`, $options: "i" } },
            { code: { $regex: `^${escapedSubject}$`, $options: "i" } },
          ],
        },
        { _id: 1 }
      ).lean();

      for (const matched of matchingSubjects) {
        matchedSubjectIds.add(matched._id.toString());
      }

      if (matchedSubjectIds.size === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const subjectObjectIds = Array.from(matchedSubjectIds, (id) => new mongoose.Types.ObjectId(id));
      const studentIdsForSubjectFilter = students.map((s) => s._id);

      const [assessmentStudents, attendanceStudents] = await Promise.all([
        Assessment.distinct("studentId", {
          studentId: { $in: studentIdsForSubjectFilter },
          subjectId: { $in: subjectObjectIds },
        }),
        Attendance.distinct("studentId", {
          studentId: { $in: studentIdsForSubjectFilter },
          subjectId: { $in: subjectObjectIds },
        }),
      ]);

      const allowedStudentIds = new Set<string>([
        ...assessmentStudents.map((id) => id.toString()),
        ...attendanceStudents.map((id) => id.toString()),
      ]);

      filteredStudents = students.filter((student) => allowedStudentIds.has(student._id.toString()));
    }

    if (filteredStudents.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const studentIds = filteredStudents.map((s) => s._id);

    // Latest risk scores
    const riskScores = await RiskScore.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $sort: { calculatedAt: -1 } },
      { $group: { _id: "$studentId", doc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);
    const riskMap = new Map(riskScores.map((r) => [r.studentId.toString(), r]));

    // Attendance aggregate per student
    const attAgg = await Attendance.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: "$studentId", total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } } } },
    ]);
    const attMap = new Map(attAgg.map((a) => [a._id.toString(), Math.round((a.present / a.total) * 100)]));

    // Marks aggregate per student
    const marksAgg = await Assessment.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: "$studentId", totalObtained: { $sum: "$marksObtained" }, totalMax: { $sum: "$maxMarks" } } },
    ]);
    const marksMap = new Map(marksAgg.map((m) => [m._id.toString(), Math.round((m.totalObtained / m.totalMax) * 100)]));

    let result = filteredStudents.map((s) => {
      const risk = riskMap.get(s._id.toString());
      return {
        id: s._id.toString(),
        name: s.fullName,
        studentId: s.studentId,
        batch: s.batch || "",
        semester: s.semester,
        attendance: attMap.get(s._id.toString()) ?? 0,
        marks: marksMap.get(s._id.toString()) ?? 0,
        riskScore: risk?.score ?? 0,
        riskLevel: risk?.riskLevel ?? "low",
      };
    });

    // Filter by risk level
    if (riskFilter !== "all") {
      result = result.filter((s) => s.riskLevel === riskFilter);
    }

    // Sort by risk score descending
    result.sort((a, b) => b.riskScore - a.riskScore);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Mentor students error:", error);
    return NextResponse.json({ success: false, message: "Failed to load students" }, { status: 500 });
  }
}
