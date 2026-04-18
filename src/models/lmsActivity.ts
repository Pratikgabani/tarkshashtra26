import mongoose, { Schema, Document } from "mongoose";

export interface ILmsActivity extends Document {
  studentId: mongoose.Types.ObjectId;
  date: Date;
  loginCount: number;
  pagesViewed: number;
  timeSpentMinutes: number;
}

const LmsActivitySchema: Schema<ILmsActivity> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    loginCount: { type: Number, required: true, min: 0 },
    pagesViewed: { type: Number, default: 0, min: 0 },
    timeSpentMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

LmsActivitySchema.index({ studentId: 1, date: 1 }, { unique: true });

const LmsActivity =
  (mongoose.models.LmsActivity as mongoose.Model<ILmsActivity>) ||
  mongoose.model<ILmsActivity>("LmsActivity", LmsActivitySchema);

export default LmsActivity;
