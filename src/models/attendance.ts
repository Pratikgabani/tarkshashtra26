import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  date: Date;
  status: "present" | "absent" | "late";
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late"],
      required: true,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });

const Attendance =
  (mongoose.models.Attendance as mongoose.Model<IAttendance>) ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
