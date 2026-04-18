import Alert from "@/src/models/alert";
import Assessment from "@/src/models/assessment";
import Assignment from "@/src/models/assignment";
import StudentAssignment from "@/src/models/studentAssignment";
import Subject from "@/src/models/subject";
import User from "@/src/models/user";

export type UiRiskLevel = "Low" | "Medium" | "High";
export type UiSubmissionStatus = "On Time" | "Late" | "Not Submitted";
export type UiAssessmentId = "ut1" | "ut2" | "mid";

export type DbAssessmentType = "unit_test_1" | "unit_test_2" | "midterm";
export type DbSubmissionStatus = "submitted_on_time" | "submitted_late" | "not_submitted";

interface AssessmentDefinition {
  id: UiAssessmentId;
  dbType: DbAssessmentType;
  label: string;
  defaultMaxMarks: number;
}

export interface TeacherIdentity {
  id: string;
  name: string;
  department: string;
  email: string;
}

export interface TeacherSubject {
  id: string;
  name: string;
  code: string;
  department: string;
  semester: number;
  maxMarks: number;
}

export interface TeacherStudent {
  id: string;
  name: string;
  studentId: string;
  batch: string;
  semester: number;
  department: string;
  assignedMentorId?: string;
}

export interface TeacherAssessment {
  id: UiAssessmentId;
  label: string;
  maxMarks: number;
}

export interface TeacherAssignment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
}

export interface TeacherSubmissionRecord {
  status: UiSubmissionStatus;
  marks: number | null;
}

export interface TeacherFlagRecord {
  note: string;
  flaggedAt: string;
}

export type TeacherMarksMap = Record<string, Record<string, Record<UiAssessmentId, number | null>>>;
export type TeacherSubmissionsMap = Record<string, Record<string, TeacherSubmissionRecord>>;
export type TeacherFlagsMap = Record<string, TeacherFlagRecord>;

export interface TeacherBaseData {
  teacher: TeacherIdentity;
  students: TeacherStudent[];
  subjects: TeacherSubject[];
  assessments: TeacherAssessment[];
  marks: TeacherMarksMap;
  assignments: TeacherAssignment[];
  submissions: TeacherSubmissionsMap;
  flags: TeacherFlagsMap;
}

export const TEACHER_ASSESSMENT_DEFINITIONS: AssessmentDefinition[] = [
  { id: "ut1", dbType: "unit_test_1", label: "Unit Test 1", defaultMaxMarks: 25 },
  { id: "ut2", dbType: "unit_test_2", label: "Unit Test 2", defaultMaxMarks: 25 },
  { id: "mid", dbType: "midterm", label: "Mid-Term", defaultMaxMarks: 50 },
];

const DB_TO_UI_ASSESSMENT_ID: Record<DbAssessmentType, UiAssessmentId> = {
  unit_test_1: "ut1",
  unit_test_2: "ut2",
  midterm: "mid",
};

const UI_TO_DB_ASSESSMENT_TYPE: Record<UiAssessmentId, DbAssessmentType> = {
  ut1: "unit_test_1",
  ut2: "unit_test_2",
  mid: "midterm",
};

const DB_TO_UI_SUBMISSION_STATUS: Record<DbSubmissionStatus, UiSubmissionStatus> = {
  submitted_on_time: "On Time",
  submitted_late: "Late",
  not_submitted: "Not Submitted",
};

const UI_TO_DB_SUBMISSION_STATUS: Record<UiSubmissionStatus, DbSubmissionStatus> = {
  "On Time": "submitted_on_time",
  Late: "submitted_late",
  "Not Submitted": "not_submitted",
};

function isStudentEligibleForSubject(student: TeacherStudent, subject: TeacherSubject): boolean {
  return student.department === subject.department && student.semester === subject.semester;
}

function emptyAssessmentRecord(): Record<UiAssessmentId, number | null> {
  return { ut1: null, ut2: null, mid: null };
}

function buildStudentScopes(subjects: TeacherSubject[]): Array<{ department: string; semester: number }> {
  const unique = new Map<string, { department: string; semester: number }>();

  for (const subject of subjects) {
    const key = `${subject.department}__${subject.semester}`;
    if (!unique.has(key)) {
      unique.set(key, { department: subject.department, semester: subject.semester });
    }
  }

  return Array.from(unique.values());
}

export function toIsoDate(value: Date | string | null | undefined): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function dbAssessmentTypeToUiAssessmentId(type: string): UiAssessmentId | null {
  if (type === "unit_test_1" || type === "unit_test_2" || type === "midterm") {
    return DB_TO_UI_ASSESSMENT_ID[type];
  }
  return null;
}

export function uiAssessmentIdToDbAssessmentType(id: UiAssessmentId): DbAssessmentType {
  return UI_TO_DB_ASSESSMENT_TYPE[id];
}

export function dbSubmissionStatusToUiStatus(status: string): UiSubmissionStatus {
  if (status === "submitted_on_time" || status === "submitted_late" || status === "not_submitted") {
    return DB_TO_UI_SUBMISSION_STATUS[status];
  }
  return "Not Submitted";
}

export function uiSubmissionStatusToDbStatus(status: UiSubmissionStatus): DbSubmissionStatus {
  return UI_TO_DB_SUBMISSION_STATUS[status];
}

export function getRiskLevelFromPercentage(percentage: number): UiRiskLevel {
  if (percentage >= 75) return "Low";
  if (percentage >= 50) return "Medium";
  return "High";
}

export function calculateSubjectPercentage(
  marks: TeacherMarksMap,
  studentId: string,
  subjectId: string,
  assessments: TeacherAssessment[]
): number {
  const total = assessments.reduce((sum, assessment) => sum + assessment.maxMarks, 0);
  if (total === 0) return 0;

  const obtained = assessments.reduce((sum, assessment) => {
    const score = marks[studentId]?.[subjectId]?.[assessment.id] ?? 0;
    return sum + score;
  }, 0);

  return Math.round((obtained / total) * 100);
}

export async function buildTeacherBaseData(teacherId: string): Promise<TeacherBaseData | null> {
  const teacherDoc = await User.findById(teacherId).lean();
  if (!teacherDoc || teacherDoc.role !== "teacher") {
    return null;
  }

  const subjectDocs = await Subject.find({ teacherId }).sort({ code: 1 }).lean();
  const subjects: TeacherSubject[] = subjectDocs.map((subject) => ({
    id: subject._id.toString(),
    name: subject.name,
    code: subject.code,
    department: subject.department,
    semester: subject.semester,
    maxMarks: subject.maxMarks ?? 100,
  }));

  const scopes = buildStudentScopes(subjects);
  const studentDocs = scopes.length > 0
    ? await User.find({ role: "student", $or: scopes }).sort({ fullName: 1 }).lean()
    : [];

  const students: TeacherStudent[] = studentDocs.map((student) => ({
    id: student._id.toString(),
    name: student.fullName,
    studentId: student.studentId || "",
    batch: student.batch || "",
    semester: student.semester || 0,
    department: student.department,
    assignedMentorId: student.assignedMentorId,
  }));

  const subjectIds = subjectDocs.map((subject) => subject._id);
  const studentIds = studentDocs.map((student) => student._id);

  const assessmentDocs = subjectIds.length > 0 && studentIds.length > 0
    ? await Assessment.find({
      subjectId: { $in: subjectIds },
      studentId: { $in: studentIds },
      assessmentType: { $in: TEACHER_ASSESSMENT_DEFINITIONS.map((definition) => definition.dbType) },
    }).lean()
    : [];

  const maxMarksByType: Record<DbAssessmentType, number> = {
    unit_test_1: TEACHER_ASSESSMENT_DEFINITIONS[0].defaultMaxMarks,
    unit_test_2: TEACHER_ASSESSMENT_DEFINITIONS[1].defaultMaxMarks,
    midterm: TEACHER_ASSESSMENT_DEFINITIONS[2].defaultMaxMarks,
  };

  for (const assessment of assessmentDocs) {
    const type = assessment.assessmentType as DbAssessmentType;
    if (type in maxMarksByType && assessment.maxMarks > maxMarksByType[type]) {
      maxMarksByType[type] = assessment.maxMarks;
    }
  }

  const assessments: TeacherAssessment[] = TEACHER_ASSESSMENT_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: definition.label,
    maxMarks: maxMarksByType[definition.dbType] ?? definition.defaultMaxMarks,
  }));

  const marks: TeacherMarksMap = {};
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));

  for (const student of students) {
    marks[student.id] = {};
    for (const subject of subjects) {
      if (!isStudentEligibleForSubject(student, subject)) continue;
      marks[student.id][subject.id] = emptyAssessmentRecord();
    }
  }

  for (const assessment of assessmentDocs) {
    const studentId = assessment.studentId.toString();
    const subjectId = assessment.subjectId.toString();
    const assessmentId = dbAssessmentTypeToUiAssessmentId(assessment.assessmentType);
    if (!assessmentId) continue;

    if (!marks[studentId]) {
      marks[studentId] = {};
    }

    if (!marks[studentId][subjectId]) {
      marks[studentId][subjectId] = emptyAssessmentRecord();
    }

    marks[studentId][subjectId][assessmentId] = assessment.marksObtained;
  }

  const assignmentDocs = subjectIds.length > 0
    ? await Assignment.find({ subjectId: { $in: subjectIds } }).sort({ dueDate: 1 }).lean()
    : [];

  const assignments: TeacherAssignment[] = assignmentDocs.map((assignment) => ({
    id: assignment._id.toString(),
    subjectId: assignment.subjectId.toString(),
    title: assignment.title,
    description: assignment.description,
    dueDate: toIsoDate(assignment.dueDate),
    maxMarks: assignment.maxMarks,
  }));

  const submissions: TeacherSubmissionsMap = {};

  for (const assignment of assignments) {
    submissions[assignment.id] = {};
    const subject = subjectById.get(assignment.subjectId);
    if (!subject) continue;

    for (const student of students) {
      if (!isStudentEligibleForSubject(student, subject)) continue;
      submissions[assignment.id][student.id] = { status: "Not Submitted", marks: null };
    }
  }

  const assignmentIds = assignmentDocs.map((assignment) => assignment._id);
  const studentAssignmentDocs = assignmentIds.length > 0 && studentIds.length > 0
    ? await StudentAssignment.find({ assignmentId: { $in: assignmentIds }, studentId: { $in: studentIds } }).lean()
    : [];

  for (const submission of studentAssignmentDocs) {
    const assignmentId = submission.assignmentId.toString();
    const studentId = submission.studentId.toString();

    if (!submissions[assignmentId]) {
      submissions[assignmentId] = {};
    }

    submissions[assignmentId][studentId] = {
      status: dbSubmissionStatusToUiStatus(submission.status),
      marks: submission.marksObtained,
    };
  }

  const flags: TeacherFlagsMap = {};
  if (studentIds.length > 0) {
    const teacherFlags = await Alert.find({
      type: "teacher_flag",
      studentId: { $in: studentIds },
      actionLink: { $regex: `teacherId=${teacherId}` },
    })
      .sort({ sentAt: -1 })
      .lean();

    for (const flag of teacherFlags) {
      const studentId = flag.studentId.toString();
      if (flags[studentId]) continue;
      flags[studentId] = {
        note: flag.message,
        flaggedAt: toIsoDate(flag.sentAt),
      };
    }
  }

  return {
    teacher: {
      id: teacherDoc._id.toString(),
      name: teacherDoc.fullName,
      department: teacherDoc.department,
      email: teacherDoc.email,
    },
    students,
    subjects,
    assessments,
    marks,
    assignments,
    submissions,
    flags,
  };
}
