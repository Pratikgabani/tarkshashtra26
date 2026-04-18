import mongoose, { Schema, Document } from "mongoose";

export interface IIntervention extends Document {
  studentId: mongoose.Types.ObjectId;
  facultyId?: mongoose.Types.ObjectId;
  type: string;
  date: Date;
  scoreBefore: number;
  scoreAfter: number;
  notes?: string;
}

const InterventionSchema: Schema<IIntervention> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    facultyId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    scoreBefore: { type: Number, required: true, min: 0, max: 100 },
    scoreAfter: { type: Number, required: true, min: 0, max: 100 },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

InterventionSchema.index({ studentId: 1, date: -1 });

const Intervention =
  (mongoose.models.Intervention as mongoose.Model<IIntervention>) ||
  mongoose.model<IIntervention>("Intervention", InterventionSchema);

export default Intervention;
