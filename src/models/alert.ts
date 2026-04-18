import mongoose, { Schema, Document } from "mongoose";

export type AlertPriority = "low" | "medium" | "high";
export type AlertStatus = "unread" | "acknowledged" | "actioned";

export interface IAlert extends Document {
  studentId: mongoose.Types.ObjectId;
  mentorId?: mongoose.Types.ObjectId;
  type: string;
  priority: AlertPriority;
  title: string;
  message: string;
  actionLink?: string;
  status: AlertStatus;
  sentAt: Date;
  readAt?: Date;
}

const AlertSchema: Schema<IAlert> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionLink: { type: String },
    status: {
      type: String,
      enum: ["unread", "acknowledged", "actioned"],
      default: "unread",
    },
    sentAt: { type: Date, default: Date.now },
    readAt: { type: Date },
  },
  { timestamps: true }
);

AlertSchema.index({ studentId: 1, sentAt: -1 });

const Alert =
  (mongoose.models.Alert as mongoose.Model<IAlert>) ||
  mongoose.model<IAlert>("Alert", AlertSchema);

export default Alert;
