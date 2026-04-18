import mongoose, { Schema, Document } from "mongoose";

export type RiskLevel = "low" | "medium" | "high";

export interface IRiskFactor {
  factor: string;
  label: string;
  currentValue: number;
  threshold: number;
  unit: string;
  weight: number;
  contribution: number; // percentage contribution to total risk
  suggestion: string;
}

export interface IRiskScore extends Document {
  studentId: mongoose.Types.ObjectId;
  score: number;
  riskLevel: RiskLevel;
  factors: IRiskFactor[];
  calculatedAt: Date;
}

const RiskFactorSchema = new Schema(
  {
    factor: { type: String, required: true },
    label: { type: String, required: true },
    currentValue: { type: Number, required: true },
    threshold: { type: Number, required: true },
    unit: { type: String, required: true },
    weight: { type: Number, required: true },
    contribution: { type: Number, required: true },
    suggestion: { type: String, required: true },
  },
  { _id: false }
);

const RiskScoreSchema: Schema<IRiskScore> = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    factors: [RiskFactorSchema],
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RiskScoreSchema.index({ studentId: 1, calculatedAt: -1 });

const RiskScore =
  (mongoose.models.RiskScore as mongoose.Model<IRiskScore>) ||
  mongoose.model<IRiskScore>("RiskScore", RiskScoreSchema);

export default RiskScore;
