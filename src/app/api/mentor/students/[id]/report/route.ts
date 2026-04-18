import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/src/lib/DB_Connection";
import { requireRoleSession, resolveScopedUserId } from "@/src/lib/routeSessionAuth";
import User from "@/src/models/user";
import Attendance from "@/src/models/attendance";
import Assessment from "@/src/models/assessment";
import MentorAction from "@/src/models/mentorAction";
import MentorRemark from "@/src/models/mentorRemark";
import { ensureLatestRiskScores } from "@/src/lib/riskScorePredictor";

type ReportFormat = "csv" | "pdf";

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n");
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): Buffer {
  const textOps: string[] = ["BT", "/F1 11 Tf", "50 760 Td"];

  for (let i = 0; i < lines.length; i += 1) {
    if (i > 0) textOps.push("0 -14 Td");
    textOps.push(`(${escapePdfText(lines[i])}) Tj`);
  }

  textOps.push("ET");
  const stream = textOps.join("\n");

  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

/**
 * GET /api/mentor/students/[id]/report?format=csv|pdf&mentorId=...
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = requireRoleSession(request, "mentor");
    if (!auth.ok) return auth.response;

    const { id: studentId } = await params;
    const formatParam = (request.nextUrl.searchParams.get("format") || "csv").trim().toLowerCase();

    if (formatParam !== "csv" && formatParam !== "pdf") {
      return NextResponse.json({ success: false, message: "Invalid report format" }, { status: 400 });
    }

    const format = formatParam as ReportFormat;

    const scopedMentorId = resolveScopedUserId(
      auth.session.sub,
      request.nextUrl.searchParams.get("mentorId")
    );
    if (!scopedMentorId.ok) return scopedMentorId.response;
    const mentorId = scopedMentorId.userId;

    const student = await User.findById(studentId).lean();
    if (!student || student.role !== "student" || student.assignedMentorId !== mentorId) {
      return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
    }

    const latestRiskMap = await ensureLatestRiskScores([student._id], {
      forceRefresh: true,
      maxAgeMinutes: 0,
    });
    const latestRisk = latestRiskMap.get(student._id.toString()) || null;

    const [attendanceAgg, marksAgg, actions] = await Promise.all([
      Attendance.aggregate([
        { $match: { studentId: student._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $eq: ["$status", "present"] }, 1, 0],
              },
            },
          },
        },
      ]),
      Assessment.aggregate([
        { $match: { studentId: student._id } },
        {
          $group: {
            _id: null,
            totalObtained: { $sum: "$marksObtained" },
            totalMax: { $sum: "$maxMarks" },
          },
        },
      ]),
      MentorAction.find({ mentorId, studentId }).sort({ date: -1 }).limit(20).lean(),
    ]);

    const actionIds = actions.map((action) => action._id);
    const remarks = await MentorRemark.find({ actionId: { $in: actionIds } }).lean();

    const attendancePercent =
      attendanceAgg.length > 0 && attendanceAgg[0].total > 0
        ? Math.round((attendanceAgg[0].present / attendanceAgg[0].total) * 100)
        : 0;

    const marksPercent =
      marksAgg.length > 0 && marksAgg[0].totalMax > 0
        ? Math.round((marksAgg[0].totalObtained / marksAgg[0].totalMax) * 100)
        : 0;

    const fileStem = (student.studentId || student._id.toString()).replace(/[^A-Za-z0-9_-]/g, "");

    if (format === "csv") {
      const rows: string[][] = [
        ["Section", "Field", "Value"],
        ["Student", "Name", student.fullName],
        ["Student", "Student ID", student.studentId || ""],
        ["Student", "Department", student.department || ""],
        ["Student", "Semester", String(student.semester || "")],
        ["Overview", "Attendance %", String(attendancePercent)],
        ["Overview", "Marks %", String(marksPercent)],
      ];

      if (latestRisk) {
        rows.push(["Risk", "Score", String(latestRisk.score)]);
        rows.push(["Risk", "Risk Level", latestRisk.riskLevel]);
        rows.push(["Risk", "Calculated At", latestRisk.calculatedAt.toISOString()]);

        for (const factor of latestRisk.factors) {
          rows.push([
            "Risk Factor",
            factor.label,
            `current=${factor.currentValue}; threshold=${factor.threshold}; contribution=${factor.contribution}`,
          ]);
        }
      }

      for (const action of actions) {
        const actionRemarks = remarks.filter(
          (remark) => remark.actionId.toString() === action._id.toString()
        );
        rows.push([
          "Intervention",
          `${action.actionType} (${action.status})`,
          `${action.date.toISOString()} | ${action.description}`,
        ]);
        rows.push([
          "Intervention",
          `Remarks on ${action._id.toString()}`,
          String(actionRemarks.length),
        ]);
      }

      const csv = toCsv(rows);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="student-${fileStem}-report.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdfLines: string[] = [
      "Student Report",
      `Generated: ${new Date().toISOString()}`,
      "",
      `Student: ${student.fullName}`,
      `Student ID: ${student.studentId || "N/A"}`,
      `Department: ${student.department || "N/A"}`,
      `Semester: ${student.semester || "N/A"}`,
      `Attendance: ${attendancePercent}%`,
      `Marks: ${marksPercent}%`,
      "",
    ];

    if (latestRisk) {
      pdfLines.push(`Risk Score: ${latestRisk.score}`);
      pdfLines.push(`Risk Level: ${latestRisk.riskLevel}`);
      pdfLines.push(`Calculated At: ${latestRisk.calculatedAt.toISOString()}`);
      pdfLines.push("Top Factors:");

      for (const factor of latestRisk.factors.slice(0, 6)) {
        pdfLines.push(
          `- ${factor.label}: current ${factor.currentValue}, threshold ${factor.threshold}, contribution ${factor.contribution}`
        );
      }
    } else {
      pdfLines.push("Risk Score: N/A");
    }

    pdfLines.push("");
    pdfLines.push("Interventions:");

    if (actions.length === 0) {
      pdfLines.push("- No interventions logged.");
    } else {
      for (const action of actions.slice(0, 12)) {
        const actionRemarks = remarks.filter(
          (remark) => remark.actionId.toString() === action._id.toString()
        );
        pdfLines.push(
          `- ${action.date.toISOString()} | ${action.actionType} | ${action.status} | remarks ${actionRemarks.length}`
        );
      }
    }

    const pdfBuffer = buildSimplePdf(pdfLines.slice(0, 45));
    const pdfBody = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="student-${fileStem}-report.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Mentor student report error:", error);
    return NextResponse.json({ success: false, message: "Failed to generate report" }, { status: 500 });
  }
}
