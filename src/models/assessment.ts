import mongoose, { Schema, Document } from "mongoose";

export type AssessmentType = "unit_test_1" | "unit_test_2" | "midterm" | "endterm";

export interface IAssessment extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  assessmentType: AssessmentType;
  marksObtained: number;
  maxMarks: number;
  date: Date;
}

const AssessmentSchema: Schema<IAssessment> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    assessmentType: {
      type: String,
      enum: ["unit_test_1", "unit_test_2", "midterm", "endterm"],
      required: true,
    },
    marksObtained: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

AssessmentSchema.index({ studentId: 1, subjectId: 1, assessmentType: 1 }, { unique: true });

const Assessment =
  (mongoose.models.Assessment as mongoose.Model<IAssessment>) ||
  mongoose.model<IAssessment>("Assessment", AssessmentSchema);

export default Assessment;
