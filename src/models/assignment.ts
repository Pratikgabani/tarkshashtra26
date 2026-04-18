import mongoose, { Schema, Document } from "mongoose";

export type SubmissionStatus = "submitted_on_time" | "submitted_late" | "not_submitted";

export interface IAssignment extends Document {
  title: string;
  description: string;
  subjectId: mongoose.Types.ObjectId;
  dueDate: Date;
  maxMarks: number;
  createdAt: Date;
}

const AssignmentSchema: Schema<IAssignment> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

const Assignment =
  (mongoose.models.Assignment as mongoose.Model<IAssignment>) ||
  mongoose.model<IAssignment>("Assignment", AssignmentSchema);

export default Assignment;
