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
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function sub(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

const EXTRA_STUDENT_NAMES = [
  "Arjun Mehta", "Priya Sharma", "Rohan Desai", "Sneha Patel",
  "Amit Joshi", "Kavita Rao", "Dev Nair", "Hinal Bhatt",
  "Manish Kumar", "Pooja Verma", "Siddharth Singh",
];

/**
 * POST /api/seed — Seeds the entire database with demo data
 *
 * Users:
 *   Student    → pratikgabani792005@gmail.com  (password: 12345678)
 *   Mentor     → sdpatel7122005@gmail.com      (password: 12345678)
 *   Teacher    → priyanshubpatel@gmail.com      (password: 12345678)
 *   Coordinator→ 230170107155@vgecg.ac.in       (password: 12345678)
 */
export async function POST() {
  try {
    await connectDB();

    // ── Clean all collections ──
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
      MentorAction.deleteMany({}),
      MentorRemark.deleteMany({}),
    ]);

    const hashedPassword = await bcrypt.hash("12345678", 10);
    const now = new Date();

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. CREATE USERS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Coordinator
    await User.create({
      fullName: "Dr. Hemant Patel",
      email: "230170107155@vgecg.ac.in",
      password: hashedPassword,
      role: "coordinator",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // Faculty Mentor
    const mentor = await User.create({
      fullName: "Prof. Sujal Patel",
      email: "sdpatel7122005@gmail.com",
      password: hashedPassword,
      role: "mentor",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // Subject Teacher
    const teacher = await User.create({
      fullName: "Prof. Priyanshi Patel",
      email: "priyanshubpatel@gmail.com",
      password: hashedPassword,
      role: "teacher",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // A second teacher for variety
    const teacher2 = await User.create({
      fullName: "Prof. Meera Shah",
      email: "meera.shah@vgecg.ac.in",
      password: hashedPassword,
      role: "teacher",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // Primary demo student
    const student = await User.create({
      fullName: "Pratik Gabani",
      email: "pratikgabani792005@gmail.com",
      password: hashedPassword,
      role: "student",
      department: "Computer Engineering",
      studentId: "22CE045",
      semester: 4,
      batch: "CE-A",
      assignedMentorId: mentor._id.toString(),
      isEmailVerified: true,
    });

    // Additional students for mentor & teacher dashboards
    const extraStudents = [];
    for (let i = 0; i < EXTRA_STUDENT_NAMES.length; i++) {
      const s = await User.create({
        fullName: EXTRA_STUDENT_NAMES[i],
        email: `student${i + 1}@vgecg.ac.in`,
        password: hashedPassword,
        role: "student",
        department: "Computer Engineering",
        studentId: `22CE${String(i + 1).padStart(3, "0")}`,
        semester: 4,
        batch: i < 6 ? "CE-A" : "CE-B",
        assignedMentorId: mentor._id.toString(),
        isEmailVerified: true,
      });
      extraStudents.push(s);
    }

    const allStudents = [student, ...extraStudents];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. CREATE SUBJECTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const subjects = await Subject.insertMany([
      { name: "Data Structures", code: "CS401", department: "Computer Engineering", semester: 4, teacherId: teacher._id, maxMarks: 100 },
      { name: "Database Management Systems", code: "CS402", department: "Computer Engineering", semester: 4, teacherId: teacher._id, maxMarks: 100 },
      { name: "Operating Systems", code: "CS403", department: "Computer Engineering", semester: 4, teacherId: teacher2._id, maxMarks: 100 },
      { name: "Mathematics IV", code: "MA401", department: "Computer Engineering", semester: 4, teacherId: teacher2._id, maxMarks: 100 },
      { name: "Computer Networks", code: "CS404", department: "Computer Engineering", semester: 4, teacherId: teacher._id, maxMarks: 100 },
    ]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. ATTENDANCE (past 8 weeks)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Attendance rates per student — primary student has mixed attendance
    const attRates = [0.62, 0.45, 0.88, 0.72, 0.95, 0.38, 0.65, 0.92, 0.50, 0.78, 0.35, 0.85];
    const attRecords = [];

    for (let si = 0; si < allStudents.length; si++) {
      for (const subj of subjects) {
        for (let d = 0; d < 56; d++) {
          const date = sub(now, d);
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          attRecords.push({
            studentId: allStudents[si]._id,
            subjectId: subj._id,
            date,
            status: Math.random() < attRates[si] ? "present" : "absent",
          });
        }
      }
    }
    await Attendance.insertMany(attRecords);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. ASSESSMENTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const marksRanges: [number, number][] = [
      [30, 55],   // Pratik — borderline
      [10, 25], [60, 85], [35, 55], [75, 95], [5, 20],
      [30, 50], [70, 90], [15, 30], [45, 65], [8, 22], [65, 80],
    ];
    const assessmentTypes: ("unit_test_1" | "unit_test_2" | "midterm")[] = ["unit_test_1", "unit_test_2", "midterm"];
    const assessmentRecords = [];

    for (let si = 0; si < allStudents.length; si++) {
      for (const subj of subjects) {
        for (let ai = 0; ai < assessmentTypes.length; ai++) {
          assessmentRecords.push({
            studentId: allStudents[si]._id,
            subjectId: subj._id,
            assessmentType: assessmentTypes[ai],
            marksObtained: rand(marksRanges[si][0], marksRanges[si][1]),
            maxMarks: 100,
            date: sub(now, (3 - ai) * 14),
          });
        }
      }
    }
    await Assessment.insertMany(assessmentRecords);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. ASSIGNMENTS + STUDENT SUBMISSIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    for (const subj of subjects) {
      for (let a = 1; a <= 3; a++) {
        const assignment = await Assignment.create({
          title: `${subj.name} — Assignment ${a}`,
          description: `Complete all questions from Chapter ${a + 2}`,
          subjectId: subj._id,
          dueDate: sub(now, (3 - a) * 14),
          maxMarks: 25,
        });

        const subs = [];
        for (let si = 0; si < allStudents.length; si++) {
          const rate = attRates[si];
          let status: "submitted_on_time" | "submitted_late" | "not_submitted";
          let marks: number | null = null;
          let submittedAt: Date | null = null;

          if (rate > 0.7) {
            status = "submitted_on_time";
            marks = rand(15, 24);
            submittedAt = sub(now, (3 - a) * 14 + 1);
          } else if (rate > 0.45) {
            status = Math.random() < 0.6 ? "submitted_late" : "not_submitted";
            marks = status !== "not_submitted" ? rand(8, 16) : null;
            submittedAt = status !== "not_submitted" ? sub(now, (3 - a) * 14 - 2) : null;
          } else {
            status = Math.random() < 0.3 ? "submitted_late" : "not_submitted";
            marks = status !== "not_submitted" ? rand(5, 12) : null;
            submittedAt = status !== "not_submitted" ? sub(now, (3 - a) * 14 - 4) : null;
          }
          subs.push({
            studentId: allStudents[si]._id,
            assignmentId: assignment._id,
            status,
            marksObtained: marks,
            submittedAt,
          });
        }
        await StudentAssignment.insertMany(subs);
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. LMS ACTIVITY (past 8 weeks)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const lmsRecords = [];
    for (let si = 0; si < allStudents.length; si++) {
      for (let day = 0; day < 56; day++) {
        const date = sub(now, day);
        if (date.getDay() === 0) continue;

        const engagement = attRates[si];
        lmsRecords.push({
          studentId: allStudents[si]._id,
          date,
          loginCount: engagement > 0.7 ? rand(2, 5) : engagement > 0.4 ? rand(0, 3) : rand(0, 1),
          pagesViewed: rand(0, Math.round(engagement * 20)),
          timeSpentMinutes: rand(5, Math.round(engagement * 120)),
        });
      }
    }
    await LmsActivity.insertMany(lmsRecords);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. RISK SCORES (current + 8 weeks history)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const riskEntries = [];
    for (let si = 0; si < allStudents.length; si++) {
      const baseScore = Math.round(
        100 - attRates[si] * 60 - (marksRanges[si][0] + marksRanges[si][1]) / 2 * 0.4
      );
      const clampedBase = Math.max(5, Math.min(95, baseScore));

      for (let w = 8; w >= 0; w--) {
        const score = Math.max(0, Math.min(100, clampedBase + rand(-5, 5) + w * 2));
        const riskLevel = score <= 25 ? "low" : score <= 50 ? "medium" : "high";

        riskEntries.push({
          studentId: allStudents[si]._id,
          score,
          riskLevel,
          factors: [
            {
              factor: "attendance",
              label: "Attendance",
              currentValue: Math.round(attRates[si] * 100),
              threshold: 75,
              unit: "%",
              weight: 0.3,
              contribution: rand(20, 40),
              suggestion: "Improve attendance to at least 75%.",
            },
            {
              factor: "assessment_marks",
              label: "Internal Assessment Marks",
              currentValue: rand(marksRanges[si][0], marksRanges[si][1]),
              threshold: 40,
              unit: "%",
              weight: 0.25,
              contribution: rand(15, 30),
              suggestion: "Focus on improving assessment scores through regular study.",
            },
            {
              factor: "assignment_completion",
              label: "Assignment Completion",
              currentValue: rand(30, 80),
              threshold: 70,
              unit: "%",
              weight: 0.2,
              contribution: rand(10, 25),
              suggestion: "Submit all pending assignments before the deadline.",
            },
            {
              factor: "lms_activity",
              label: "LMS Activity",
              currentValue: randFloat(1.0, 4.0),
              threshold: 3,
              unit: "logins/week",
              weight: 0.15,
              contribution: rand(5, 15),
              suggestion: "Login to the LMS at least 3 times per week.",
            },
            {
              factor: "submission_timeliness",
              label: "Submission Timeliness",
              currentValue: rand(1, 5),
              threshold: 2,
              unit: "late submissions",
              weight: 0.1,
              contribution: rand(3, 10),
              suggestion: "Submit assignments on time to avoid penalty.",
            },
          ],
          calculatedAt: sub(now, w * 7),
        });
      }
    }
    await RiskScore.insertMany(riskEntries);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. ALERTS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Alerts for primary student (Pratik)
    await Alert.insertMany([
      {
        studentId: student._id,
        mentorId: mentor._id,
        type: "risk_threshold",
        priority: "high",
        title: "High Risk Alert — Attendance Declining",
        message:
          "Your attendance in Data Structures has dropped to 62%, which is below the required 75%. This is a major contributor to your risk score. Please prioritize attending upcoming classes.",
        actionLink: "/student",
        status: "unread",
        sentAt: sub(now, 2),
      },
      {
        studentId: student._id,
        mentorId: mentor._id,
        type: "assignment_missing",
        priority: "medium",
        title: "Missing Assignments — Action Required",
        message:
          "You have 2 pending assignments in Data Structures that are past their due date. Please submit them as soon as possible.",
        actionLink: "/student",
        status: "unread",
        sentAt: sub(now, 5),
      },
      {
        studentId: student._id,
        type: "exam_proximity",
        priority: "high",
        title: "End-term Exam in 14 Days",
        message:
          "Your end-term exams begin in 14 days. Focus on improving attendance and submitting pending assignments.",
        actionLink: "/student",
        status: "acknowledged",
        sentAt: sub(now, 10),
        readAt: sub(now, 9),
      },
      {
        studentId: student._id,
        type: "lms_inactive",
        priority: "medium",
        title: "Low LMS Engagement",
        message:
          "You have logged into the LMS only 2 times in the past week. The recommended minimum is 3 logins per week.",
        actionLink: "/student",
        status: "acknowledged",
        sentAt: sub(now, 14),
        readAt: sub(now, 13),
      },
    ]);

    // Alerts for high-risk extra students
    const highRiskIndices = [0, 4, 7, 9]; // indices in extraStudents with low attRates
    for (const si of highRiskIndices) {
      if (si >= extraStudents.length) continue;
      await Alert.insertMany([
        {
          studentId: extraStudents[si]._id,
          mentorId: mentor._id,
          type: "risk_threshold",
          priority: "high",
          title: `${EXTRA_STUDENT_NAMES[si]} — Risk Level Elevated`,
          message: `${EXTRA_STUDENT_NAMES[si]}'s risk score has crossed the high-risk threshold. Attendance is at ${Math.round(attRates[si + 1] * 100)}% and marks are below average.`,
          status: si === 0 ? "acknowledged" : "unread",
          sentAt: sub(now, rand(1, 7)),
        },
        {
          studentId: extraStudents[si]._id,
          mentorId: mentor._id,
          type: "assignment_missing",
          priority: "medium",
          title: `${EXTRA_STUDENT_NAMES[si]} — Missing Assignments`,
          message: `${EXTRA_STUDENT_NAMES[si]} has multiple pending assignments. Please follow up.`,
          status: "unread",
          sentAt: sub(now, rand(3, 14)),
        },
      ]);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 9. MENTOR ACTIONS & REMARKS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Action for primary student
    const action1 = await MentorAction.create({
      mentorId: mentor._id,
      studentId: student._id,
      actionType: "counseling",
      description: "One-on-one counseling session to discuss attendance and academic performance.",
      date: sub(now, 10),
      status: "completed",
      outcome: "Student acknowledged issues and committed to attending regularly.",
    });

    await MentorRemark.create({
      actionId: action1._id,
      mentorId: mentor._id,
      studentId: student._id,
      text: "Student seemed receptive. Will monitor attendance for the next 2 weeks.",
      followUpDate: sub(now, -4),
    });

    // Action for extra students
    if (extraStudents.length > 4) {
      await MentorAction.create({
        mentorId: mentor._id,
        studentId: extraStudents[4]._id,
        actionType: "extra_class",
        description: "Arranged extra Data Structures tutorial to help with fundamentals.",
        date: sub(now, 5),
        status: "scheduled",
      });
    }

    if (extraStudents.length > 9) {
      await MentorAction.create({
        mentorId: mentor._id,
        studentId: extraStudents[9]._id,
        actionType: "parent_meeting",
        description: "Scheduled parent meeting to discuss high-risk academic performance.",
        date: sub(now, -2),
        status: "scheduled",
      });
    }

    if (extraStudents.length > 7) {
      const action2 = await MentorAction.create({
        mentorId: mentor._id,
        studentId: extraStudents[7]._id,
        actionType: "academic_support",
        description: "Assigned peer mentor for OS and Math subjects.",
        date: sub(now, 14),
        status: "completed",
        outcome: "Peer mentoring sessions started. Student showing some improvement.",
      });

      await MentorRemark.create({
        actionId: action2._id,
        mentorId: mentor._id,
        studentId: extraStudents[7]._id,
        text: "Peer mentor reports the student is attending sessions regularly. Marks improved slightly.",
        followUpDate: sub(now, -7),
      });
    }

    // Additional counseling for Pratik
    const action3 = await MentorAction.create({
      mentorId: mentor._id,
      studentId: student._id,
      actionType: "academic_support",
      description: "Recommended additional study resources and scheduled weekly check-ins.",
      date: sub(now, 3),
      status: "scheduled",
    });

    await MentorRemark.create({
      actionId: action3._id,
      mentorId: mentor._id,
      studentId: student._id,
      text: "Shared study material links. Will follow up next week to check progress.",
      followUpDate: sub(now, -3),
    });

    return NextResponse.json({
      success: true,
      message: "Database seed completed successfully",
      data: {
        accounts: [
          { role: "student", email: "pratikgabani792005@gmail.com", password: "12345678" },
          { role: "mentor", email: "sdpatel7122005@gmail.com", password: "12345678" },
          { role: "teacher", email: "priyanshubpatel@gmail.com", password: "12345678" },
          { role: "coordinator", email: "230170107155@vgecg.ac.in", password: "12345678" },
        ],
        stats: {
          totalStudents: allStudents.length,
          totalSubjects: subjects.length,
          totalAttendanceRecords: attRecords.length,
          totalAssessmentRecords: assessmentRecords.length,
        },
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
