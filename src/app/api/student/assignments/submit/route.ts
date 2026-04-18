import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";

interface SubmitAssignmentInput {
  assignmentId?: string;
}

function resolveSubmissionStatus(now: Date, dueDate: Date): "submitted_on_time" | "submitted_late" {
  return now.getTime() <= dueDate.getTime() ? "submitted_on_time" : "submitted_late";
}

/**
 * POST /api/student/assignments/submit
 * Body: { assignmentId }
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "student");
    if (!auth.ok) return auth.response;

    const body = (await request.json()) as SubmitAssignmentInput;
    const assignmentId = body.assignmentId?.trim();

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, message: "assignmentId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid assignmentId format" },
        { status: 400 }
      );
    }

    const studentId = auth.session.sub;

    const [student, assignment] = await Promise.all([
      User.findById(studentId)
        .select("_id role department semester")
        .lean(),
      Assignment.findById(assignmentId)
        .select("_id subjectId dueDate")
        .lean(),
    ]);

    if (!student || student.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    if (!assignment) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 }
      );
    }

    const subject = await Subject.findById(assignment.subjectId)
      .select("_id department semester")
      .lean();

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Subject not found for assignment" },
        { status: 404 }
      );
    }

    if (student.department !== subject.department || student.semester !== subject.semester) {
      return NextResponse.json(
        { success: false, message: "You are not allowed to submit this assignment" },
        { status: 403 }
      );
    }

    const existingSubmission = await StudentAssignment.findOne({
      studentId,
      assignmentId,
    })
      .select("status")
      .lean();

    const now = new Date();
    const submissionStatus = resolveSubmissionStatus(now, assignment.dueDate);

    await StudentAssignment.findOneAndUpdate(
      { studentId, assignmentId },
      {
        $set: {
          status: submissionStatus,
          submittedAt: now,
        },
        $setOnInsert: {
          marksObtained: null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const isResubmission =
      Boolean(existingSubmission) && existingSubmission?.status !== "not_submitted";

    return NextResponse.json({
      success: true,
      message: isResubmission
        ? "Assignment resubmitted successfully"
        : "Assignment submitted successfully",
      data: {
        assignmentId,
        status: submissionStatus,
        submittedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Student assignment submit error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
