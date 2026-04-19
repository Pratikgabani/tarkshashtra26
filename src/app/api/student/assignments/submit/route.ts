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

const MAX_SOLUTION_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const SUBMISSION_UPLOADS_RELATIVE_DIR = "uploads/assignment-submissions";
const ALLOWED_SOLUTION_FILE_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
const ALLOWED_SOLUTION_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function resolveSubmissionStatus(now: Date, dueDate: Date): "submitted_on_time" | "submitted_late" {
  return now.getTime() <= dueDate.getTime() ? "submitted_on_time" : "submitted_late";
}

function sanitizeBaseName(fileName: string): string {
  const parsed = path.parse(fileName);
  const cleaned = parsed.name.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return cleaned || "submission";
}

function resolveAllowedFileExtension(file: File): string | null {
  const extensionFromName = path.extname(file.name).toLowerCase();
  if (ALLOWED_SOLUTION_FILE_EXTENSIONS.has(extensionFromName)) {
    return extensionFromName;
  }

  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "application/msword") return ".doc";
  if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  return null;
}

function resolveExistingUploadAbsolutePath(fileUrl: string): string | null {
  const normalized = fileUrl.replace(/\\/g, "/");
  const expectedPrefix = `/${SUBMISSION_UPLOADS_RELATIVE_DIR}/`;
  if (!normalized.startsWith(expectedPrefix)) return null;
  return path.join(process.cwd(), "public", normalized.slice(1));
}

/**
 * POST /api/student/assignments/submit
 * Multipart body: assignmentId + file (PDF/DOC/DOCX)
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
        { success: false, message: "A solution file is required" },
        { status: 400 }
      );
    }

    if (fileField.size === 0) {
      return NextResponse.json(
        { success: false, message: "Uploaded file is empty" },
        { status: 400 }
      );
    }

    if (fileField.size > MAX_SOLUTION_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "Solution file must be 15MB or smaller" },
        { status: 400 }
      );
    }

    const extension = resolveAllowedFileExtension(fileField);
    const isAllowedMimeType = ALLOWED_SOLUTION_FILE_MIME_TYPES.has(fileField.type);
    const isAllowedByExtension = extension !== null;

    if (!isAllowedMimeType && !isAllowedByExtension) {
      return NextResponse.json(
        { success: false, message: "Only PDF, DOC, and DOCX files are allowed" },
        { status: 400 }
      );
    }

    if (!extension) {
      return NextResponse.json(
        { success: false, message: "Unsupported file extension. Use PDF, DOC, or DOCX" },
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
    const storedFileName = `${studentId}_${assignmentId}_${randomUUID()}_${sanitizedBaseName}${extension}`;
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
            submissionMimeType: fileField.type || "application/octet-stream",
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
