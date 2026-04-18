import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession } from "@/src/lib/routeSessionAuth";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
const SUBMISSION_UPLOADS_RELATIVE_DIR = "uploads/assignment-submissions";

function resolveSubmissionStatus(now: Date, dueDate: Date): "submitted_on_time" | "submitted_late" {
  return now.getTime() <= dueDate.getTime() ? "submitted_on_time" : "submitted_late";
}

function sanitizeBaseName(fileName: string): string {
  const parsed = path.parse(fileName);
  const cleaned = parsed.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return cleaned || "submission";
}

function resolveExistingUploadAbsolutePath(fileUrl: string): string | null {
  const normalized = fileUrl.replace(/\\/g, "/");
  const expectedPrefix = `/${SUBMISSION_UPLOADS_RELATIVE_DIR}/`;
  if (!normalized.startsWith(expectedPrefix)) return null;
  return path.join(process.cwd(), "public", normalized.slice(1));
}

/**
 * POST /api/student/assignments/submit
 * Multipart body: assignmentId + file (PDF)
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "student");
    if (!auth.ok) return auth.response;

    const formData = await request.formData();
    const assignmentIdField = formData.get("assignmentId");
    const fileField = formData.get("file");

    const assignmentId = typeof assignmentIdField === "string" ? assignmentIdField.trim() : "";

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

    if (!(fileField instanceof File)) {
      return NextResponse.json(
        { success: false, message: "A PDF file is required" },
        { status: 400 }
      );
    }

    if (fileField.size === 0) {
      return NextResponse.json(
        { success: false, message: "Uploaded file is empty" },
        { status: 400 }
      );
    }

    if (fileField.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "PDF must be 10MB or smaller" },
        { status: 400 }
      );
    }

    const isPdfMimeType = fileField.type === "application/pdf";
    const hasPdfExtension = fileField.name.toLowerCase().endsWith(".pdf");

    if (!isPdfMimeType && !hasPdfExtension) {
      return NextResponse.json(
        { success: false, message: "Only PDF files are allowed" },
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
      .select("status submissionFileUrl")
      .lean();

    const uploadsAbsoluteDir = path.join(process.cwd(), "public", SUBMISSION_UPLOADS_RELATIVE_DIR);
    await fs.mkdir(uploadsAbsoluteDir, { recursive: true });

    const fileBuffer = Buffer.from(await fileField.arrayBuffer());
    const sanitizedBaseName = sanitizeBaseName(fileField.name);
    const storedFileName = `${studentId}_${assignmentId}_${randomUUID()}_${sanitizedBaseName}.pdf`;
    const storedAbsolutePath = path.join(uploadsAbsoluteDir, storedFileName);
    const submissionFileUrl = `/${SUBMISSION_UPLOADS_RELATIVE_DIR}/${storedFileName}`;

    await fs.writeFile(storedAbsolutePath, fileBuffer);

    const now = new Date();
    const submissionStatus = resolveSubmissionStatus(now, assignment.dueDate);

    try {
      await StudentAssignment.findOneAndUpdate(
        { studentId, assignmentId },
        {
          $set: {
            status: submissionStatus,
            submittedAt: now,
            submissionFileUrl,
            submissionFileName: fileField.name,
            submissionMimeType: fileField.type || "application/pdf",
            submissionSizeBytes: fileField.size,
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
    } catch (error) {
      await fs.unlink(storedAbsolutePath).catch(() => undefined);
      throw error;
    }

    if (existingSubmission?.submissionFileUrl && existingSubmission.submissionFileUrl !== submissionFileUrl) {
      const oldAbsolutePath = resolveExistingUploadAbsolutePath(existingSubmission.submissionFileUrl);
      if (oldAbsolutePath) {
        await fs.unlink(oldAbsolutePath).catch(() => undefined);
      }
    }

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
        submissionFileUrl,
        submissionFileName: fileField.name,
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
