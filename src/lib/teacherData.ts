// ─── Types ─────────────────────────────────────────────────────────────────

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type SubmissionStatus = 'On Time' | 'Late' | 'Not Submitted';

export interface Student {
  id: string;
  name: string;
  batch: string;
  semester: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Assessment {
  id: string;
  label: string;
  maxMarks: number;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
}

export interface SubmissionRecord {
  status: SubmissionStatus;
  marks: number | null;
}

// marks[studentId][subjectId][assessmentId] = marks | null
export type MarksMap = Record<string, Record<string, Record<string, number | null>>>;

// submissions[assignmentId][studentId]
export type SubmissionsMap = Record<string, Record<string, SubmissionRecord>>;

// flags[studentId]
export type FlagsMap = Record<string, { note: string; flaggedAt: string }>;

// ─── Static Reference Data ──────────────────────────────────────────────────

export const TEACHER = {
  name: 'Dr. Meera Iyer',
  department: 'Computer Engineering',
  email: 'meera.iyer@university.ac.in',
};

export const STUDENTS: Student[] = [
  { id: 's01', name: 'Arjun Mehta',       batch: 'CE-A', semester: 3 },
  { id: 's02', name: 'Priya Sharma',      batch: 'CE-A', semester: 3 },
  { id: 's03', name: 'Rohan Desai',       batch: 'CE-A', semester: 3 },
  { id: 's04', name: 'Sneha Patel',       batch: 'CE-A', semester: 3 },
  { id: 's05', name: 'Amit Joshi',        batch: 'CE-A', semester: 3 },
  { id: 's06', name: 'Kavita Rao',        batch: 'CE-A', semester: 3 },
  { id: 's07', name: 'Dev Nair',          batch: 'CE-A', semester: 3 },
  { id: 's08', name: 'Hinal Bhatt',       batch: 'CE-A', semester: 3 },
  { id: 's09', name: 'Manish Kumar',      batch: 'CE-A', semester: 3 },
  { id: 's10', name: 'Pooja Verma',       batch: 'CE-A', semester: 3 },
  { id: 's11', name: 'Siddharth Singh',   batch: 'CE-B', semester: 3 },
  { id: 's12', name: 'Nishu Gupta',       batch: 'CE-B', semester: 3 },
  { id: 's13', name: 'Tarun Shah',        batch: 'CE-B', semester: 3 },
  { id: 's14', name: 'Aarav Patel',       batch: 'CE-B', semester: 3 },
  { id: 's15', name: 'Divya Mishra',      batch: 'CE-B', semester: 3 },
  { id: 's16', name: 'Raj Thakkar',       batch: 'CE-B', semester: 3 },
  { id: 's17', name: 'Nidhi Jain',        batch: 'CE-B', semester: 3 },
  { id: 's18', name: 'Vikas Choudhary',   batch: 'CE-B', semester: 3 },
  { id: 's19', name: 'Anisha Reddy',      batch: 'CE-B', semester: 3 },
  { id: 's20', name: 'Pratik Malhotra',   batch: 'CE-B', semester: 3 },
];

export const SUBJECTS: Subject[] = [
  { id: 'DS', name: 'Data Structures',   code: 'CE301' },
  { id: 'M3', name: 'Mathematics III',   code: 'MA301' },
  { id: 'OS', name: 'Operating Systems', code: 'CE302' },
];

export const ASSESSMENTS: Assessment[] = [
  { id: 'ut1', label: 'Unit Test 1', maxMarks: 25 },
  { id: 'ut2', label: 'Unit Test 2', maxMarks: 25 },
  { id: 'mid', label: 'Mid-Term',    maxMarks: 50 },
];

// ─── Mock: Marks ────────────────────────────────────────────────────────────
// For each student: DS, M3, OS  ×  ut1(25), ut2(25), mid(50)

export const INITIAL_MARKS: MarksMap = {
  s01: { DS: { ut1: 8,  ut2: 10, mid: 18 }, M3: { ut1: 12, ut2: 14, mid: 28 }, OS: { ut1: 9,  ut2: 11, mid: 20 } },
  s02: { DS: { ut1: 15, ut2: 17, mid: 35 }, M3: { ut1: 20, ut2: 18, mid: 40 }, OS: { ut1: 16, ut2: 19, mid: 36 } },
  s03: { DS: { ut1: 19, ut2: 21, mid: 42 }, M3: { ut1: 22, ut2: 20, mid: 44 }, OS: { ut1: 20, ut2: 22, mid: 43 } },
  s04: { DS: { ut1: 23, ut2: 24, mid: 47 }, M3: { ut1: 24, ut2: 25, mid: 48 }, OS: { ut1: 22, ut2: 23, mid: 46 } },
  s05: { DS: { ut1: 6,  ut2: 8,  mid: 14 }, M3: { ut1: 10, ut2: 8,  mid: 19 }, OS: { ut1: 7,  ut2: 9,  mid: 15 } },
  s06: { DS: { ut1: 13, ut2: 15, mid: 30 }, M3: { ut1: 17, ut2: 16, mid: 33 }, OS: { ut1: 14, ut2: 15, mid: 29 } },
  s07: { DS: { ut1: 20, ut2: 22, mid: 44 }, M3: { ut1: 21, ut2: 23, mid: 46 }, OS: { ut1: 21, ut2: 22, mid: 43 } },
  s08: { DS: { ut1: 11, ut2: 9,  mid: 21 }, M3: { ut1: 13, ut2: 12, mid: 25 }, OS: { ut1: 10, ut2: 11, mid: 22 } },
  s09: { DS: { ut1: 17, ut2: 18, mid: 36 }, M3: { ut1: 18, ut2: 17, mid: 37 }, OS: { ut1: 17, ut2: 19, mid: 37 } },
  s10: { DS: { ut1: 7,  ut2: 6,  mid: 12 }, M3: { ut1: 9,  ut2: 8,  mid: 16 }, OS: { ut1: 8,  ut2: 7,  mid: 14 } },
  s11: { DS: { ut1: 22, ut2: 23, mid: 46 }, M3: { ut1: 23, ut2: 24, mid: 47 }, OS: { ut1: 22, ut2: 21, mid: 44 } },
  s12: { DS: { ut1: 14, ut2: 16, mid: 31 }, M3: { ut1: 16, ut2: 15, mid: 32 }, OS: { ut1: 15, ut2: 16, mid: 31 } },
  s13: { DS: { ut1: 9,  ut2: 11, mid: 22 }, M3: { ut1: 11, ut2: 10, mid: 23 }, OS: { ut1: 10, ut2: 12, mid: 24 } },
  s14: { DS: { ut1: 24, ut2: 25, mid: 49 }, M3: { ut1: 25, ut2: 24, mid: 48 }, OS: { ut1: 23, ut2: 24, mid: 48 } },
  s15: { DS: { ut1: 18, ut2: 19, mid: 38 }, M3: { ut1: 19, ut2: 20, mid: 40 }, OS: { ut1: 18, ut2: 20, mid: 39 } },
  s16: { DS: { ut1: 5,  ut2: 7,  mid: 11 }, M3: { ut1: 8,  ut2: 7,  mid: 15 }, OS: { ut1: 6,  ut2: 8,  mid: 13 } },
  s17: { DS: { ut1: 21, ut2: 20, mid: 41 }, M3: { ut1: 20, ut2: 22, mid: 43 }, OS: { ut1: 22, ut2: 21, mid: 42 } },
  s18: { DS: { ut1: 12, ut2: 13, mid: 25 }, M3: { ut1: 14, ut2: 13, mid: 27 }, OS: { ut1: 12, ut2: 14, mid: 26 } },
  s19: { DS: { ut1: 16, ut2: 17, mid: 34 }, M3: { ut1: 17, ut2: 18, mid: 36 }, OS: { ut1: 16, ut2: 18, mid: 35 } },
  s20: { DS: { ut1: 10, ut2: 9,  mid: 19 }, M3: { ut1: 11, ut2: 10, mid: 21 }, OS: { ut1: 9,  ut2: 11, mid: 20 } },
};

// ─── Mock: Assignments ──────────────────────────────────────────────────────

export const ASSIGNMENTS: Assignment[] = [
  { id: 'a1', subjectId: 'DS', title: 'Implementing AVL Tree',        description: 'Build a self-balancing AVL tree with insert, delete, and search operations.',    dueDate: '2026-04-05', maxMarks: 20 },
  { id: 'a2', subjectId: 'DS', title: 'Graph BFS & DFS',              description: 'Implement both BFS and DFS on a weighted graph with adjacency list.',            dueDate: '2026-04-15', maxMarks: 20 },
  { id: 'a3', subjectId: 'DS', title: 'Hash Table Implementation',     description: 'Implement a hash table with chaining for collision resolution.',                 dueDate: '2026-04-25', maxMarks: 20 },
  { id: 'a4', subjectId: 'M3', title: 'Fourier Series Problems',       description: 'Solve 10 Fourier series expansion problems from the textbook.',                 dueDate: '2026-04-08', maxMarks: 15 },
  { id: 'a5', subjectId: 'M3', title: 'Laplace Transform Assignment',  description: 'Solve 8 Laplace transform problems including inverse transforms.',              dueDate: '2026-04-18', maxMarks: 15 },
  { id: 'a6', subjectId: 'M3', title: 'Linear Algebra Problem Set',    description: '15 problems on eigenvalues, eigenvectors, and matrix diagonalization.',         dueDate: '2026-04-28', maxMarks: 15 },
  { id: 'a7', subjectId: 'OS', title: 'CPU Scheduling Simulation',     description: 'Implement FCFS, SJF, and Round Robin CPU scheduling algorithms.',               dueDate: '2026-04-10', maxMarks: 25 },
  { id: 'a8', subjectId: 'OS', title: 'Deadlock Detection Program',    description: "Write a program to detect deadlock using Banker's algorithm.",                  dueDate: '2026-04-20', maxMarks: 25 },
  { id: 'a9', subjectId: 'OS', title: 'Page Replacement Algorithms',   description: 'Implement FIFO, LRU, and Optimal page replacement algorithms.',                 dueDate: '2026-04-30', maxMarks: 25 },
];

// ─── Mock: Submissions ──────────────────────────────────────────────────────

export const INITIAL_SUBMISSIONS: SubmissionsMap = {
  a1: {
    s01: { status: 'Late',          marks: 12 }, s02: { status: 'On Time',       marks: 18 },
    s03: { status: 'On Time',       marks: 19 }, s04: { status: 'On Time',       marks: 20 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'On Time',       marks: 15 },
    s07: { status: 'On Time',       marks: 20 }, s08: { status: 'Late',           marks: 11 },
    s09: { status: 'On Time',       marks: 17 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 19 }, s12: { status: 'On Time',        marks: 15 },
    s13: { status: 'Late',          marks: 13 }, s14: { status: 'On Time',       marks: 20 },
    s15: { status: 'On Time',       marks: 17 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 18 }, s18: { status: 'On Time',        marks: 14 },
    s19: { status: 'On Time',       marks: 16 }, s20: { status: 'Late',           marks: 10 },
  },
  a2: {
    s01: { status: 'Not Submitted', marks: null}, s02: { status: 'On Time',       marks: 17 },
    s03: { status: 'On Time',       marks: 18 }, s04: { status: 'On Time',        marks: 20 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'Late',          marks: 13 },
    s07: { status: 'On Time',       marks: 19 }, s08: { status: 'Not Submitted',  marks: null},
    s09: { status: 'On Time',       marks: 17 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 20 }, s12: { status: 'On Time',        marks: 15 },
    s13: { status: 'Not Submitted', marks: null}, s14: { status: 'On Time',       marks: 20 },
    s15: { status: 'On Time',       marks: 18 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 19 }, s18: { status: 'Late',           marks: 12 },
    s19: { status: 'On Time',       marks: 17 }, s20: { status: 'Not Submitted',  marks: null},
  },
  a3: {
    s01: { status: 'Not Submitted', marks: null}, s02: { status: 'On Time',       marks: 16 },
    s03: { status: 'On Time',       marks: 18 }, s04: { status: 'On Time',        marks: 19 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'On Time',       marks: 14 },
    s07: { status: 'On Time',       marks: 20 }, s08: { status: 'Not Submitted',  marks: null},
    s09: { status: 'Late',          marks: 15 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 19 }, s12: { status: 'On Time',        marks: 14 },
    s13: { status: 'Not Submitted', marks: null}, s14: { status: 'On Time',       marks: 20 },
    s15: { status: 'On Time',       marks: 17 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 18 }, s18: { status: 'Late',           marks: 11 },
    s19: { status: 'On Time',       marks: 16 }, s20: { status: 'Not Submitted',  marks: null},
  },
  a4: {
    s01: { status: 'Late',          marks: 9  }, s02: { status: 'On Time',        marks: 13 },
    s03: { status: 'On Time',       marks: 14 }, s04: { status: 'On Time',        marks: 15 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'On Time',       marks: 11 },
    s07: { status: 'On Time',       marks: 15 }, s08: { status: 'Late',           marks: 8  },
    s09: { status: 'On Time',       marks: 13 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 14 }, s12: { status: 'On Time',        marks: 12 },
    s13: { status: 'Late',          marks: 10 }, s14: { status: 'On Time',        marks: 15 },
    s15: { status: 'On Time',       marks: 13 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 14 }, s18: { status: 'On Time',        marks: 11 },
    s19: { status: 'On Time',       marks: 12 }, s20: { status: 'Late',           marks: 8  },
  },
  a5: {
    s01: { status: 'Not Submitted', marks: null}, s02: { status: 'On Time',       marks: 12 },
    s03: { status: 'On Time',       marks: 14 }, s04: { status: 'On Time',        marks: 15 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'Late',          marks: 10 },
    s07: { status: 'On Time',       marks: 15 }, s08: { status: 'Not Submitted',  marks: null},
    s09: { status: 'On Time',       marks: 12 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 14 }, s12: { status: 'On Time',        marks: 11 },
    s13: { status: 'Not Submitted', marks: null}, s14: { status: 'On Time',       marks: 15 },
    s15: { status: 'On Time',       marks: 13 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 14 }, s18: { status: 'Late',           marks: 9  },
    s19: { status: 'On Time',       marks: 13 }, s20: { status: 'Not Submitted',  marks: null},
  },
  a6: {
    s01: { status: 'Not Submitted', marks: null}, s02: { status: 'On Time',       marks: 13 },
    s03: { status: 'On Time',       marks: 14 }, s04: { status: 'On Time',        marks: 15 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'On Time',       marks: 11 },
    s07: { status: 'On Time',       marks: 15 }, s08: { status: 'Not Submitted',  marks: null},
    s09: { status: 'On Time',       marks: 13 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 15 }, s12: { status: 'On Time',        marks: 12 },
    s13: { status: 'Not Submitted', marks: null}, s14: { status: 'On Time',       marks: 15 },
    s15: { status: 'On Time',       marks: 14 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 14 }, s18: { status: 'Late',           marks: 10 },
    s19: { status: 'On Time',       marks: 13 }, s20: { status: 'Not Submitted',  marks: null},
  },
  a7: {
    s01: { status: 'Late',          marks: 16 }, s02: { status: 'On Time',        marks: 22 },
    s03: { status: 'On Time',       marks: 23 }, s04: { status: 'On Time',        marks: 25 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'On Time',       marks: 19 },
    s07: { status: 'On Time',       marks: 25 }, s08: { status: 'Late',           marks: 15 },
    s09: { status: 'On Time',       marks: 21 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 24 }, s12: { status: 'On Time',        marks: 20 },
    s13: { status: 'Late',          marks: 17 }, s14: { status: 'On Time',        marks: 25 },
    s15: { status: 'On Time',       marks: 22 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 23 }, s18: { status: 'On Time',        marks: 18 },
    s19: { status: 'On Time',       marks: 21 }, s20: { status: 'Late',           marks: 14 },
  },
  a8: {
    s01: { status: 'Not Submitted', marks: null}, s02: { status: 'On Time',       marks: 20 },
    s03: { status: 'On Time',       marks: 22 }, s04: { status: 'On Time',        marks: 24 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'Late',          marks: 17 },
    s07: { status: 'On Time',       marks: 24 }, s08: { status: 'Not Submitted',  marks: null},
    s09: { status: 'On Time',       marks: 21 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 23 }, s12: { status: 'On Time',        marks: 19 },
    s13: { status: 'Not Submitted', marks: null}, s14: { status: 'On Time',       marks: 25 },
    s15: { status: 'On Time',       marks: 22 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 23 }, s18: { status: 'Late',           marks: 16 },
    s19: { status: 'On Time',       marks: 21 }, s20: { status: 'Not Submitted',  marks: null},
  },
  a9: {
    s01: { status: 'Not Submitted', marks: null}, s02: { status: 'On Time',       marks: 22 },
    s03: { status: 'On Time',       marks: 24 }, s04: { status: 'On Time',        marks: 25 },
    s05: { status: 'Not Submitted', marks: null}, s06: { status: 'On Time',       marks: 19 },
    s07: { status: 'On Time',       marks: 25 }, s08: { status: 'Not Submitted',  marks: null},
    s09: { status: 'Late',          marks: 20 }, s10: { status: 'Not Submitted',  marks: null},
    s11: { status: 'On Time',       marks: 24 }, s12: { status: 'On Time',        marks: 18 },
    s13: { status: 'Not Submitted', marks: null}, s14: { status: 'On Time',       marks: 25 },
    s15: { status: 'On Time',       marks: 22 }, s16: { status: 'Not Submitted',  marks: null},
    s17: { status: 'On Time',       marks: 23 }, s18: { status: 'Late',           marks: 15 },
    s19: { status: 'On Time',       marks: 21 }, s20: { status: 'Not Submitted',  marks: null},
  },
};

// ─── Mock: Flags ────────────────────────────────────────────────────────────

export const INITIAL_FLAGS: FlagsMap = {
  s01: { note: 'Student appears disengaged. Multiple assignments not submitted.',             flaggedAt: '2026-04-10' },
  s05: { note: 'Very low marks across all assessments. Needs immediate counselling.',         flaggedAt: '2026-04-12' },
  s10: { note: 'Has not submitted any assignments for the last two weeks.',                    flaggedAt: '2026-04-14' },
  s16: { note: 'Consistently low performance. Not responding to classroom interactions.',     flaggedAt: '2026-04-15' },
};

// ─── Utility: Compute total percentage for a student in a subject ────────────

export function computeSubjectPercentage(
  marks: MarksMap,
  studentId: string,
  subjectId: string
): number {
  const total = ASSESSMENTS.reduce((acc, a) => acc + a.maxMarks, 0); // 25+25+50 = 100
  const obtained = ASSESSMENTS.reduce((acc, a) => {
    const m = marks[studentId]?.[subjectId]?.[a.id];
    return acc + (m ?? 0);
  }, 0);
  return Math.round((obtained / total) * 100);
}

export function getRiskLevel(pct: number): RiskLevel {
  if (pct >= 75) return 'Low';
  if (pct >= 50) return 'Medium';
  if (pct >= 40) return 'High';
  return 'Critical';
}
