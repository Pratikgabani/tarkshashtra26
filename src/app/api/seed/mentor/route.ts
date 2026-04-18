import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/src/lib/DB_Connection";
import User from "@/src/models/user";
import Subject from "@/src/models/subject";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import RiskScore from "@/src/models/riskScore";
import Alert from "@/src/models/alert";
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function sub(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

const STUDENT_NAMES = [
  "Arjun Mehta", "Priya Sharma", "Rohan Desai", "Sneha Patel",
  "Amit Joshi", "Kavita Rao", "Dev Nair", "Hinal Bhatt",
  "Manish Kumar", "Pooja Verma", "Siddharth Singh", "Nishu Gupta",
];

/**
 * POST /api/seed/mentor — Seeds mentor-specific demo data
 */
export async function POST() {
  try {
    await connectDB();

    // Clean
    await Promise.all([
      User.deleteMany({}), Subject.deleteMany({}), Attendance.deleteMany({}),
      Assessment.deleteMany({}), Assignment.deleteMany({}), StudentAssignment.deleteMany({}),
      RiskScore.deleteMany({}), Alert.deleteMany({}), MentorAction.deleteMany({}),
      MentorRemark.deleteMany({}),
    ]);

    const pwd = await bcrypt.hash("password123", 10);
    const now = new Date();

    // ── Create Mentor ──
    const mentor = await User.create({
      fullName: "Dr. Rajesh Kumar",
      email: "mentor@college.edu",
      password: pwd,
      role: "mentor",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // ── Create Teacher ──
    const teacher = await User.create({
      fullName: "Prof. Anita Sharma",
      email: "teacher@college.edu",
      password: pwd,
      role: "teacher",
      department: "Computer Engineering",
      isEmailVerified: true,
    });

    // ── Create Subjects ──
    const subjects = await Subject.insertMany([
      { name: "Data Structures", code: "CS301", department: "Computer Engineering", semester: 3, teacherId: teacher._id, maxMarks: 100 },
      { name: "Mathematics III", code: "MA301", department: "Computer Engineering", semester: 3, teacherId: teacher._id, maxMarks: 100 },
      { name: "Operating Systems", code: "CS302", department: "Computer Engineering", semester: 3, teacherId: teacher._id, maxMarks: 100 },
    ]);

    // ── Create 12 Students assigned to mentor ──
    const studentDocs = [];
    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const s = await User.create({
        fullName: STUDENT_NAMES[i],
        email: `student${i + 1}@college.edu`,
        password: pwd,
        role: "student",
        department: "Computer Engineering",
        studentId: `22CE${String(i + 1).padStart(3, "0")}`,
        semester: 3,
        batch: i < 6 ? "CE-A" : "CE-B",
        assignedMentorId: mentor._id.toString(),
        isEmailVerified: true,
      });
      studentDocs.push(s);
    }

    // ── Attendance (8 weeks) ──
    // Different attendance rates to create varied risk profiles
    const attRates = [0.45, 0.88, 0.72, 0.95, 0.38, 0.65, 0.92, 0.50, 0.78, 0.35, 0.85, 0.60];
    const attRecords = [];
    for (let si = 0; si < studentDocs.length; si++) {
      for (const subj of subjects) {
        for (let d = 0; d < 56; d++) {
          const date = sub(now, d);
          if (date.getDay() === 0 || date.getDay() === 6) continue;
          attRecords.push({
            studentId: studentDocs[si]._id,
            subjectId: subj._id,
            date,
            status: Math.random() < attRates[si] ? "present" : "absent",
          });
        }
      }
    }
    await Attendance.insertMany(attRecords);

    // ── Assessments ──
    // Marks ranges per student (low → high performing)
    const marksRanges: [number, number][] = [
      [10, 25], [60, 85], [35, 55], [75, 95], [5, 20],
      [30, 50], [70, 90], [15, 30], [45, 65], [8, 22],
      [65, 80], [25, 45],
    ];
    const assessmentTypes: ("unit_test_1" | "unit_test_2" | "midterm")[] = ["unit_test_1", "unit_test_2", "midterm"];
    const assessmentRecords = [];
    for (let si = 0; si < studentDocs.length; si++) {
      for (const subj of subjects) {
        for (let ai = 0; ai < assessmentTypes.length; ai++) {
          assessmentRecords.push({
            studentId: studentDocs[si]._id,
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

    // ── Assignments + Student Submissions ──
    for (const subj of subjects) {
      for (let a = 1; a <= 3; a++) {
        const assignment = await Assignment.create({
          title: `${subj.name} — Assignment ${a}`,
          description: `Complete problem set ${a}`,
          subjectId: subj._id,
          dueDate: sub(now, (3 - a) * 14),
          maxMarks: 25,
        });

        const subs = [];
        for (let si = 0; si < studentDocs.length; si++) {
          const rate = attRates[si]; // reuse as a proxy for engagement
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
          subs.push({ studentId: studentDocs[si]._id, assignmentId: assignment._id, status, marksObtained: marks, submittedAt });
        }
        await StudentAssignment.insertMany(subs);
      }
    }

    // ── Risk Scores (current + 8 weeks history) ──
    for (let si = 0; si < studentDocs.length; si++) {
      const baseScore = Math.round(100 - attRates[si] * 60 - (marksRanges[si][0] + marksRanges[si][1]) / 2 * 0.4);
      const clampedBase = Math.max(5, Math.min(95, baseScore));

      for (let w = 8; w >= 0; w--) {
        const score = Math.max(0, Math.min(100, clampedBase + rand(-5, 5) + (w * 2)));
        const riskLevel = score <= 25 ? "low" : score <= 50 ? "medium" : score <= 75 ? "high" : "critical";

        await RiskScore.create({
          studentId: studentDocs[si]._id,
          score,
          riskLevel,
          factors: [
            { factor: "attendance", label: "Attendance", currentValue: Math.round(attRates[si] * 100), threshold: 75, unit: "%", weight: 0.3, contribution: rand(20, 40), suggestion: "Improve attendance to at least 75%." },
            { factor: "assessment_marks", label: "Internal Marks", currentValue: rand(marksRanges[si][0], marksRanges[si][1]), threshold: 40, unit: "%", weight: 0.25, contribution: rand(15, 30), suggestion: "Focus on improving assessment scores." },
            { factor: "assignment_completion", label: "Assignments", currentValue: rand(30, 80), threshold: 70, unit: "%", weight: 0.2, contribution: rand(10, 25), suggestion: "Submit all pending assignments." },
          ],
          calculatedAt: sub(now, w * 7),
        });
      }
    }

    // ── Alerts ──
    // High-risk students get alerts
    const highRiskIndices = [0, 4, 7, 9]; // Students with low attRates
    for (const si of highRiskIndices) {
      await Alert.insertMany([
        {
          studentId: studentDocs[si]._id,
          mentorId: mentor._id,
          type: "risk_threshold",
          priority: "high",
          title: `${STUDENT_NAMES[si]} — Risk Level Elevated`,
          message: `${STUDENT_NAMES[si]}'s risk score has crossed the high-risk threshold. Attendance is at ${Math.round(attRates[si] * 100)}% and marks are below average. Immediate intervention recommended.`,
          status: si === 0 ? "acknowledged" : "unread",
          sentAt: sub(now, rand(1, 7)),
        },
        {
          studentId: studentDocs[si]._id,
          mentorId: mentor._id,
          type: "assignment_missing",
          priority: "medium",
          title: `${STUDENT_NAMES[si]} — Missing Assignments`,
          message: `${STUDENT_NAMES[si]} has multiple pending assignments. Please follow up during the next counseling session.`,
          status: "unread",
          sentAt: sub(now, rand(3, 14)),
        },
      ]);
    }

    // ── Sample Actions + Remarks (for demo) ──
    const action1 = await MentorAction.create({
      mentorId: mentor._id,
      studentId: studentDocs[0]._id,
      actionType: "counseling",
      description: "One-on-one counseling session to discuss attendance and academic performance.",
      date: sub(now, 10),
      status: "completed",
      outcome: "Student acknowledged issues and committed to attending regularly.",
    });

    await MentorRemark.create({
      actionId: action1._id,
      mentorId: mentor._id,
      studentId: studentDocs[0]._id,
      text: "Student seemed receptive. Will monitor attendance for the next 2 weeks.",
      followUpDate: sub(now, -4), // 4 days from now
    });

    await MentorAction.create({
      mentorId: mentor._id,
      studentId: studentDocs[4]._id,
      actionType: "extra_class",
      description: "Arranged extra Data Structures tutorial to help with fundamentals.",
      date: sub(now, 5),
      status: "scheduled",
    });

    await MentorAction.create({
      mentorId: mentor._id,
      studentId: studentDocs[9]._id,
      actionType: "parent_meeting",
      description: "Scheduled parent meeting to discuss critical academic performance.",
      date: sub(now, -2),
      status: "scheduled",
    });

    const action2 = await MentorAction.create({
      mentorId: mentor._id,
      studentId: studentDocs[7]._id,
      actionType: "academic_support",
      description: "Assigned peer mentor for OS and Math subjects.",
      date: sub(now, 14),
      status: "completed",
      outcome: "Peer mentoring sessions started. Student showing some improvement in class participation.",
    });

    await MentorRemark.create({
      actionId: action2._id,
      mentorId: mentor._id,
      studentId: studentDocs[7]._id,
      text: "Peer mentor reports the student is attending sessions regularly. Marks improved slightly in last UT.",
      followUpDate: sub(now, -7),
    });

    return NextResponse.json({
      success: true,
      message: "Mentor demo data seeded",
      data: {
        mentorEmail: "mentor@college.edu",
        teacherEmail: "teacher@college.edu",
        password: "password123",
        mentorId: mentor._id,
        students: studentDocs.length,
      },
    });
  } catch (error) {
    console.error("Mentor seed error:", error);
    return NextResponse.json({ success: false, message: "Seed failed", error: String(error) }, { status: 500 });
  }
}
