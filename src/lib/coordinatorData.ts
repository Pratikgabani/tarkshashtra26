// Coordinator Mock Data Repository

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type Department = 'Computer Eng.' | 'Mechanical Eng.' | 'Civil Eng.' | 'Electrical Eng.';
export type UserRole = 'Student' | 'Teacher' | 'Mentor';

export interface StudentRecord {
  id: string;
  name: string;
  department: Department;
  classBatch: string;
  attendance: number;
  avgMarks: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  riskScore: number;
  riskLevel: RiskLevel;
  riskExplanation: string;
}

export interface InterventionRecord {
  id: string;
  studentId: string;
  studentName: string;
  facultyName: string;
  type: string;
  date: string;
  scoreBefore: number;
  scoreAfter: number; // For "After" vs "Before" tracking
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  status: 'Active' | 'Inactive';
}

// ─── UTILITIES ──────────────────────────────────────────

export function calculateRisk(attendance: number, marks: number, assignmentsRate: number) {
  let score = 100;
  const explanation: string[] = [];
  
  if (attendance < 75) {
    score -= (75 - attendance) * 1.5;
    explanation.push('low attendance');
  }
  if (marks < 50) {
    score -= (50 - marks) * 0.8;
    explanation.push('low marks');
  }
  if (assignmentsRate < 80) {
    score -= (80 - assignmentsRate) * 0.5;
    explanation.push('missing assignments');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  
  let level: RiskLevel = 'Low';
  if (score < 40) level = 'Critical';
  else if (score < 60) level = 'High';
  else if (score < 75) level = 'Medium';
  
  return {
    score,
    level,
    explanation: score < 75 ? `Risk due to ${explanation.join(' and ')}` : 'Performing well',
  };
}

// ─── BASE DATA ──────────────────────────────────────────

export const DEPARTMENTS: Department[] = ['Computer Eng.', 'Mechanical Eng.', 'Civil Eng.', 'Electrical Eng.'];
export const CLASSES = ['CE-A', 'CE-B', 'ME-A', 'EE-A', 'CV-A'];

export const MOCK_STUDENTS: StudentRecord[] = [
  ...Array(150).fill(null).map((_, i) => {
    const isAtRisk = Math.random() > 0.7; // ~30% at risk globally
    const attendance = isAtRisk ? 40 + Math.floor(Math.random() * 40) : 75 + Math.floor(Math.random() * 25);
    const marks = isAtRisk ? 30 + Math.floor(Math.random() * 30) : 60 + Math.floor(Math.random() * 40);
    const completed = isAtRisk ? Math.floor(Math.random() * 5) : 8 + Math.floor(Math.random() * 3);
    const rate = Math.round((completed / 10) * 100);
    const risk = calculateRisk(attendance, marks, rate);

    return {
      id: `STU${1000 + i}`,
      name: `Student ${100 + i}`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      classBatch: CLASSES[i % CLASSES.length],
      attendance,
      avgMarks: marks,
      assignmentsCompleted: completed,
      totalAssignments: 10,
      riskScore: risk.score,
      riskLevel: risk.level,
      riskExplanation: risk.explanation
    };
  })
];

// Ensure some realistic trends (Make Mechanical Engineering slightly higher risk to trigger pattern detection)
MOCK_STUDENTS.forEach(s => {
  if (s.department === 'Mechanical Eng.' && s.classBatch === 'ME-A') {
      s.avgMarks = Math.max(20, s.avgMarks - 15);
      const risk = calculateRisk(s.attendance, s.avgMarks, (s.assignmentsCompleted/10)*100);
      s.riskScore = risk.score;
      s.riskLevel = risk.level;
  }
});

export const MOCK_INTERVENTIONS: InterventionRecord[] = [
  { id: 'INV1', studentId: 'STU1042', studentName: 'Arjun Mehta', facultyName: 'Prof. Sharma', type: 'Academic Counseling', date: '2026-03-15', scoreBefore: 38, scoreAfter: 55 },
  { id: 'INV2', studentId: 'STU1088', studentName: 'Sneha Patel', facultyName: 'Dr. Kumar', type: 'Extra Classes', date: '2026-03-10', scoreBefore: 45, scoreAfter: 68 },
  { id: 'INV3', studentId: 'STU1012', studentName: 'Rohan Gupta', facultyName: 'Dr. Kumar', type: 'Parent Meeting', date: '2026-03-22', scoreBefore: 32, scoreAfter: 40 },
  { id: 'INV4', studentId: 'STU1105', studentName: 'Priya Singh', facultyName: 'Prof. Desai', type: 'Academic Counseling', date: '2026-04-01', scoreBefore: 50, scoreAfter: 55 },
];

export const MOCK_USERS: UserRecord[] = [
  { id: 'U001', name: 'Dr. A. Coordinator', email: 'admin@college.edu', role: 'Teacher', department: 'Computer Eng.', status: 'Active' },
  { id: 'U002', name: 'Prof. Sharma', email: 'sharma@college.edu', role: 'Mentor', department: 'Mechanical Eng.', status: 'Active' },
  { id: 'U003', name: 'Dr. Kumar', email: 'kumar@college.edu', role: 'Teacher', department: 'Civil Eng.', status: 'Active' },
  { id: 'U004', name: 'Arjun Mehta', email: 'arjun@college.edu', role: 'Student', department: 'Computer Eng.', status: 'Active' },
  { id: 'U005', name: 'Sneha Patel', email: 'sneha@college.edu', role: 'Student', department: 'Mechanical Eng.', status: 'Inactive' },
];

// Aggregation Helpers
export function getSystemAggregates() {
  const total = MOCK_STUDENTS.length;
  const atRisk = MOCK_STUDENTS.filter(s => s.riskLevel === 'High' || s.riskLevel === 'Critical').length;
  
  const riskDist = {
    Low: MOCK_STUDENTS.filter(s => s.riskLevel === 'Low').length,
    Medium: MOCK_STUDENTS.filter(s => s.riskLevel === 'Medium').length,
    High: MOCK_STUDENTS.filter(s => s.riskLevel === 'High').length,
    Critical: MOCK_STUDENTS.filter(s => s.riskLevel === 'Critical').length,
  };

  const deptStats = DEPARTMENTS.map(d => {
    const deptStudents = MOCK_STUDENTS.filter(s => s.department === d);
    const deptAtRisk = deptStudents.filter(s => s.riskLevel === 'High' || s.riskLevel === 'Critical').length;
    return {
      department: d,
      total: deptStudents.length,
      atRisk: deptAtRisk,
      riskRate: Math.round((deptAtRisk / deptStudents.length) * 100) || 0
    };
  });

  return { total, atRisk, riskDist, deptStats };
}
