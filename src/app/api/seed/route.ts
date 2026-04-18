import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import Subject from "@/src/models/subject";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import LmsActivity from "@/src/models/lmsActivity";
import RiskScore from "@/src/models/riskScore";
import Alert from "@/src/models/alert";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export async function POST() {
  try {
    await connectDB();

    // --- Clear existing data ---
    await Promise.all([
      User.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
      Assessment.deleteMany({}),
      Assignment.deleteMany({}),
      StudentAssignment.deleteMany({}),
      LmsActivity.deleteMany({}),
      RiskScore.deleteMany({}),
      Alert.deleteMany({}),
    ]);

    const hashedPassword = await bcrypt.hash("password123", 10);
    const now = new Date();

    // --- Create Mentor ---
    const mentor = await User.create({
      fullName: "Dr. Rajesh Kumar",
      email: "rajesh.kumar@college.edu",
      password: hashedPassword,
      role: "mentor",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // --- Create Teacher ---
    const teacher = await User.create({
      fullName: "Prof. Anita Sharma",
      email: "anita.sharma@college.edu",
      password: hashedPassword,
      role: "teacher",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // --- Create Demo Student ---
    const student = await User.create({
      fullName: "Sujal Patel",
      email: "sujal@college.edu",
      password: hashedPassword,
      role: "student",
      department: "Computer Engineering",
      studentId: "22CE045",
      semester: 3,
      batch: "CE-A",
      assignedMentorId: mentor._id.toString(),
      isEmailVerified: true,
    });

    // --- Create Subjects ---
    const subjects = await Subject.insertMany([
      { name: "Data Structures", code: "CS301", department: "Computer Engineering", semester: 3, teacherId: teacher._id, maxMarks: 100 },
      { name: "Mathematics III", code: "MA301", department: "Computer Engineering", semester: 3, teacherId: teacher._id, maxMarks: 100 },
      { name: "Operating Systems", code: "CS302", department: "Computer Engineering", semester: 3, teacherId: teacher._id, maxMarks: 100 },
    ]);

    // --- Attendance (past 8 weeks) ---
    const attendanceRecords = [];
    for (const subject of subjects) {
      for (let day = 0; day < 56; day++) {
        const date = subDays(now, day);
        if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends

        // Different attendance rates per subject to show variety
        const attendanceRate =
          subject.code === "CS301" ? 0.55 : subject.code === "MA301" ? 0.72 : 0.82;

        attendanceRecords.push({
          studentId: student._id,
          subjectId: subject._id,
          date,
          status: Math.random() < attendanceRate ? "present" : "absent",
        });
      }
    }
    await Attendance.insertMany(attendanceRecords);

    // --- Assessments ---
    const assessmentTypes = [
      { type: "unit_test_1" as const, daysAgo: 42 },
      { type: "unit_test_2" as const, daysAgo: 21 },
      { type: "midterm" as const, daysAgo: 7 },
    ];

    const assessments = [];
    for (const subject of subjects) {
      for (const at of assessmentTypes) {
        let marksObtained: number;
        if (subject.code === "CS301") {
          marksObtained = randomBetween(15, 30); // struggling
        } else if (subject.code === "MA301") {
          marksObtained = randomBetween(28, 42); // borderline
        } else {
          marksObtained = randomBetween(55, 78); // decent
        }
        assessments.push({
          studentId: student._id,
          subjectId: subject._id,
          assessmentType: at.type,
          marksObtained,
          maxMarks: 100,
          date: subDays(now, at.daysAgo),
        });
      }
    }
    await Assessment.insertMany(assessments);

    // --- Assignments ---
    const assignmentData = [];
    const studentAssignmentData = [];

    for (const subject of subjects) {
      for (let i = 1; i <= 3; i++) {
        const assignment = await Assignment.create({
          title: `${subject.name} — Assignment ${i}`,
          description: `Complete all questions from Chapter ${i + 2}`,
          subjectId: subject._id,
          dueDate: subDays(now, (3 - i) * 14),
          maxMarks: 25,
        });
        assignmentData.push(assignment);

        let status: "submitted_on_time" | "submitted_late" | "not_submitted";
        let marksObtained: number | null = null;
        let submittedAt: Date | null = null;

        if (subject.code === "CS301") {
          // Struggling student — misses assignments
          if (i === 1) {
            status = "submitted_late";
            marksObtained = randomBetween(8, 14);
            submittedAt = subDays(now, (3 - i) * 14 - 3);
          } else if (i === 2) {
            status = "not_submitted";
          } else {
            status = "not_submitted";
          }
        } else if (subject.code === "MA301") {
          // Borderline
          if (i <= 2) {
            status = "submitted_on_time";
            marksObtained = randomBetween(12, 18);
            submittedAt = subDays(now, (3 - i) * 14 + 1);
          } else {
            status = "submitted_late";
            marksObtained = randomBetween(10, 15);
            submittedAt = subDays(now, (3 - i) * 14 - 2);
          }
        } else {
          // Decent
          status = "submitted_on_time";
          marksObtained = randomBetween(17, 23);
          submittedAt = subDays(now, (3 - i) * 14 + 2);
        }

        studentAssignmentData.push({
          studentId: student._id,
          assignmentId: assignment._id,
          status,
          marksObtained,
          submittedAt,
        });
      }
    }
    await StudentAssignment.insertMany(studentAssignmentData);

    // --- LMS Activity (past 8 weeks) ---
    const lmsRecords = [];
    for (let day = 0; day < 56; day++) {
      const date = subDays(now, day);
      if (date.getDay() === 0) continue;

      lmsRecords.push({
        studentId: student._id,
        date,
        loginCount: day < 14 ? randomBetween(0, 2) : randomBetween(1, 4),
        pagesViewed: randomBetween(0, 12),
        timeSpentMinutes: randomBetween(5, 90),
      });
    }
    await LmsActivity.insertMany(lmsRecords);

    // --- Risk Score History (8 weeks) ---
    const riskHistoryEntries = [];
    for (let week = 8; week >= 0; week--) {
      const baseScore = week === 0 ? 62 : 70 - week * 1.5 + randomFloat(-5, 5);
      const score = Math.max(0, Math.min(100, Math.round(baseScore)));

      const riskLevel =
        score <= 25 ? "low" : score <= 50 ? "medium" : "high";

      riskHistoryEntries.push({
        studentId: student._id,
        score,
        riskLevel,
        factors: [
          {
            factor: "attendance",
            label: "Attendance",
            currentValue: randomFloat(50, 72),
            threshold: 75,
            unit: "%",
            weight: 0.3,
            contribution: randomFloat(25, 40),
            suggestion: "Attend at least 5 more classes this month to reach the 75% threshold.",
          },
          {
            factor: "assessment_marks",
            label: "Internal Assessment Marks",
            currentValue: randomFloat(22, 38),
            threshold: 40,
            unit: "%",
            weight: 0.25,
            contribution: randomFloat(18, 30),
            suggestion: "Your marks in Data Structures are below the passing threshold. Attend the next remedial session.",
          },
          {
            factor: "assignment_completion",
            label: "Assignment Completion",
            currentValue: randomFloat(45, 65),
            threshold: 70,
            unit: "%",
            weight: 0.2,
            contribution: randomFloat(12, 22),
            suggestion: "You have 3 pending assignments. Submit them before the deadline.",
          },
          {
            factor: "lms_activity",
            label: "LMS Activity",
            currentValue: randomFloat(1.2, 2.8),
            threshold: 3,
            unit: "logins/week",
            weight: 0.15,
            contribution: randomFloat(8, 15),
            suggestion: "Login to the LMS at least 3 times this week and review the materials.",
          },
          {
            factor: "submission_timeliness",
            label: "Submission Timeliness",
            currentValue: randomBetween(2, 4),
            threshold: 2,
            unit: "late submissions",
            weight: 0.1,
            contribution: randomFloat(4, 10),
            suggestion: "You have 3 late submissions. Contact your teacher to discuss deadline extensions.",
          },
        ],
        calculatedAt: subDays(now, week * 7),
      });
    }
    await RiskScore.insertMany(riskHistoryEntries);

    // --- Alerts ---
    await Alert.insertMany([
      {
        studentId: student._id,
        mentorId: mentor._id,
        type: "risk_threshold",
        priority: "high",
        title: "High Risk Alert — Attendance Declining",
        message: "Your attendance in Data Structures has dropped to 55%, which is below the required 75%. This is a major contributor to your risk score. Please prioritize attending upcoming classes.",
        actionLink: "/student/dashboard",
        status: "unread",
        sentAt: subDays(now, 2),
      },
      {
        studentId: student._id,
        mentorId: mentor._id,
        type: "assignment_missing",
        priority: "medium",
        title: "Missing Assignments — Action Required",
        message: "You have 2 pending assignments in Data Structures that are past their due date. Please submit them as soon as possible or contact your teacher for an extension.",
        actionLink: "/student/dashboard",
        status: "unread",
        sentAt: subDays(now, 5),
      },
      {
        studentId: student._id,
        type: "exam_proximity",
        priority: "high",
        title: "End-term Exam in 14 Days",
        message: "Your end-term exams begin in 14 days and you are currently at High Risk. Focus on improving attendance and submitting pending assignments to improve your score before exams.",
        actionLink: "/student/dashboard",
        status: "acknowledged",
        sentAt: subDays(now, 10),
        readAt: subDays(now, 9),
      },
      {
        studentId: student._id,
        type: "lms_inactive",
        priority: "medium",
        title: "Low LMS Engagement",
        message: "You have logged into the LMS only 2 times in the past week. The recommended minimum is 3 logins per week. Review your course materials regularly.",
        actionLink: "/student/dashboard",
        status: "acknowledged",
        sentAt: subDays(now, 14),
        readAt: subDays(now, 13),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Mock data seeded successfully",
      data: {
        studentEmail: "sujal@college.edu",
        studentPassword: "password123",
        studentId: student._id,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed data", error: String(error) },
      { status: 500 }
    );
  }
}
