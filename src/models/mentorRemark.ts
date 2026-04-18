import mongoose, { Schema, Document } from "mongoose";

export interface IMentorRemark extends Document {
  actionId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  text: string;
  followUpDate?: Date;
  createdAt: Date;
}

const MentorRemarkSchema: Schema<IMentorRemark> = new Schema(
  {
    actionId: { type: Schema.Types.ObjectId, ref: "MentorAction", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

MentorRemarkSchema.index({ actionId: 1 });
MentorRemarkSchema.index({ studentId: 1, createdAt: -1 });

const MentorRemark =
  (mongoose.models.MentorRemark as mongoose.Model<IMentorRemark>) ||
  mongoose.model<IMentorRemark>("MentorRemark", MentorRemarkSchema);

export default MentorRemark;
