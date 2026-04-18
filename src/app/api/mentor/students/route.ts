import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import User from "@/src/models/user";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import RiskScore from "@/src/models/riskScore";

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

    const riskFilter = request.nextUrl.searchParams.get("risk");
    const search = request.nextUrl.searchParams.get("search");
    const batch = request.nextUrl.searchParams.get("batch");
    const sanitizedBatch = batch?.trim();

    if (sanitizedBatch && !/^[A-Za-z0-9-]{1,20}$/.test(sanitizedBatch)) {
      return NextResponse.json({ success: false, message: "Invalid batch filter" }, { status: 400 });
    }

    // Build student query
    const query: Record<string, unknown> = { assignedMentorId: mentorId, role: "student" };
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.fullName = { $regex: escapedSearch, $options: "i" };
    }
    if (sanitizedBatch) query.batch = sanitizedBatch;

    const students = await User.find(query).lean();
    const studentIds = students.map((s) => s._id);

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

    let result = students.map((s) => {
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
    if (riskFilter && riskFilter !== "all") {
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
