import mongoose, { Schema, Document } from "mongoose";

export interface ISubject extends Document {
  name: string;
  code: string;
  department: string;
  semester: number;
  teacherId: mongoose.Types.ObjectId;
  maxMarks: number;
  createdAt: Date;
}

const SubjectSchema: Schema<ISubject> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, unique: true },
    department: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    teacherId: { type: Schema.Types.ObjectId, ref: "User" },
    maxMarks: { type: Number, default: 100 },
  },
  { timestamps: true }
);

const Subject =
  (mongoose.models.Subject as mongoose.Model<ISubject>) ||
  mongoose.model<ISubject>("Subject", SubjectSchema);

export default Subject;
