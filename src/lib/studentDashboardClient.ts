export type UiRiskLevel = "Low" | "Medium" | "High";

export interface StudentDashboardStudent {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  batch: string;
  mentor?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
}

export interface StudentRiskFactor {
  factor: string;
  label: string;
  currentValue: number;
  threshold: number;
  unit: string;
  weight: number;
  contribution: number;
  suggestion: string;
}

export interface StudentRiskScore {
  studentId: string;
  score: number;
  riskLevel: "low" | "medium" | "high";
  factors: StudentRiskFactor[];
  calculatedAt: string;
}

export interface StudentAssessment {
  type: string;
  marksObtained: number;
  maxMarks: number;
  date: string;
}

export interface StudentAssignmentEntry {
  assignmentId: string;
  title: string;
  status: "submitted_on_time" | "submitted_late" | "not_submitted";
  dueDate: string;
  marksObtained: number | null;
  maxMarks: number;
  assignmentFileUrl: string | null;
  assignmentFileName: string | null;
}

export interface StudentSubjectPerformance {
  subjectId: string;
  name: string;
  code: string;
  faculty: string;
  attendance: number;
  marksPercent: number;
  completionRate: number;
  assessments: StudentAssessment[];
  assignments: StudentAssignmentEntry[];
}

export interface StudentPendingAssignment {
  assignmentId: string;
  subjectId: string;
  title: string;
  subjectName: string;
  dueDate: string;
  maxMarks: number;
}

export interface StudentRiskHistoryPoint {
  score: number;
  riskLevel: "low" | "medium" | "high";
  date: string;
  intervention?: boolean;
}

export interface StudentAlert {
  id: string;
  type: string;
  priority: "low" | "medium" | "high";
  title: string;
  message: string;
  status: "unread" | "acknowledged" | "actioned";
  sentAt: string;
  actionLink?: string;
}

export interface StudentDashboardData {
  student: StudentDashboardStudent;
  riskScore: StudentRiskScore;
  motivationalMessage: string;
  overallStats: {
    attendance: number;
    marksPercent: number;
    assignmentCompletionRate: number;
    lateSubmissions: number;
    avgLoginsPerWeek: number;
    pendingAssignments: number;
    pendingAssignmentCount: number;
  };
  subjectPerformance: StudentSubjectPerformance[];
  pendingAssignments: StudentPendingAssignment[];
  riskHistory: StudentRiskHistoryPoint[];
  alerts: StudentAlert[];
  unreadAlertCount?: number;
  generatedAt?: string;
}

export function toUiRiskLevel(level: string | undefined): UiRiskLevel {
  if (level?.toLowerCase() === "high") return "High";
  if (level?.toLowerCase() === "medium") return "Medium";
  return "Low";
}

export function formatRelativeDate(isoDate: string): string {
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return "Unknown";

  const now = Date.now();
  const diffMs = now - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.round(diffMs / minute));
    return `${minutes} min ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.round(diffMs / hour));
    return `${hours} hr ago`;
  }

  const days = Math.max(1, Math.round(diffMs / day));
  if (days <= 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return new Date(isoDate).toLocaleDateString("en-GB");
}

export async function fetchStudentDashboardData(): Promise<{ ok: true; data: StudentDashboardData } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/student/dashboard", { cache: "no-store" });
    const json = await response.json();

    if (response.ok && json?.success && json?.data) {
      return { ok: true, data: json.data as StudentDashboardData };
    }

    return {
      ok: false,
      message: json?.message || "Unable to load student data.",
    };
  } catch {
    return {
      ok: false,
      message: "Unable to load student data.",
    };
  }
}
