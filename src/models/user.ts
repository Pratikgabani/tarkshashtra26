import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "student" | "mentor" | "teacher" | "coordinator";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  studentId?: string;       // Only for students
  semester?: number;        // Only for students
  batch?: string;           // Only for students
  assignedMentorId?: string; // Only for students — links to a mentor user
  isEmailVerified: boolean;
  signupOtpHash?: string;
  signupOtpExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name must be less than 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["student", "mentor", "teacher", "coordinator"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true,
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    batch: {
      type: String,
      trim: true,
    },
    assignedMentorId: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    signupOtpHash: {
      type: String,
      trim: true,
    },
    signupOtpExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
