import mongoose, { Schema, Document } from "mongoose";
import type { SubmissionStatus } from "./assignment";

export interface IStudentAssignment extends Document {
  studentId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  status: SubmissionStatus;
  marksObtained: number | null;
  submittedAt: Date | null;
  submissionFileUrl?: string | null;
  submissionFileName?: string | null;
  submissionMimeType?: string | null;
  submissionSizeBytes?: number | null;
}

const StudentAssignmentSchema: Schema<IStudentAssignment> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    status: {
      type: String,
      enum: ["submitted_on_time", "submitted_late", "not_submitted"],
      required: true,
      default: "not_submitted",
    },
    marksObtained: { type: Number, default: null },
    submittedAt: { type: Date, default: null },
    submissionFileUrl: { type: String, trim: true, default: null },
    submissionFileName: { type: String, trim: true, default: null },
    submissionMimeType: { type: String, trim: true, default: null },
    submissionSizeBytes: { type: Number, default: null },
  },
  { timestamps: true }
);

StudentAssignmentSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

const StudentAssignment =
  (mongoose.models.StudentAssignment as mongoose.Model<IStudentAssignment>) ||
  mongoose.model<IStudentAssignment>("StudentAssignment", StudentAssignmentSchema);

export default StudentAssignment;
