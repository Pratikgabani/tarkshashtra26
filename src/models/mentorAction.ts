import mongoose, { Schema, Document } from "mongoose";

export type ActionType =
  | "counseling"
  | "extra_class"
  | "academic_support"
  | "parent_meeting"
  | "peer_mentoring"
  | "other";

export interface IMentorAction extends Document {
  mentorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  actionType: ActionType;
  description: string;
  date: Date;
  status: "scheduled" | "completed" | "cancelled";
  outcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MentorActionSchema: Schema<IMentorAction> = new Schema(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actionType: {
      type: String,
      enum: ["counseling", "extra_class", "academic_support", "parent_meeting", "peer_mentoring", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    outcome: { type: String, trim: true },
  },
  { timestamps: true }
);

MentorActionSchema.index({ mentorId: 1, studentId: 1 });

const MentorAction =
  (mongoose.models.MentorAction as mongoose.Model<IMentorAction>) ||
  mongoose.model<IMentorAction>("MentorAction", MentorActionSchema);

export default MentorAction;
