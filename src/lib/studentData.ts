export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export const STUDENT_INFO = {
  id: 'S1042',
  name: 'Arjun Mehta',
  email: 'arjun.mehta@university.edu',
  department: 'Computer Engineering',
  semester: 3,
  batch: 'CE-B',
  mentor: 'Prof. Anjali Sharma',
};

export const RISK_SCORE_DATA = {
  score: 68,
  level: 'Medium' as RiskLevel,
  calculatedAt: '2026-04-18T08:30:00Z',
  trend: 'worsening', // 'improving' | 'worsening' | 'stable'
  message: "Your score has dropped slightly this week. Focus on submitting pending assignments to get back on track.",
  factors: [
    { factor: 'Attendance', label: 'Low Attendance in Data Structures', currentValue: 58, threshold: 75, unit: '%', contribution: 45, suggestion: 'You need 75%. Attend 7 more classes this month.' },
    { factor: 'Assignments', label: 'Missing Assignments', currentValue: 2, threshold: 0, unit: 'missing', contribution: 35, suggestion: 'You have 2 pending assignments. Submit them this week.' },
    { factor: 'Marks', label: 'Low Internal Marks', currentValue: 38, threshold: 40, unit: '%', contribution: 20, suggestion: 'Score at least 15/20 in the upcoming Unit Test.' },
  ]
};

export const OVERALL_STATS = {
  attendance: 72,
  marksPercent: 64,
  assignmentCompletionRate: 80,
  lateSubmissions: 2,
  pendingAssignments: 3,
};

export const RISK_HISTORY = [
  { week: 'Week 1', score: 85, date: 'Feb 15' },
  { week: 'Week 2', score: 82, date: 'Feb 22' },
  { week: 'Week 3', score: 78, date: 'Mar 1', intervention: true },
  { week: 'Week 4', score: 80, date: 'Mar 8' },
  { week: 'Week 5', score: 75, date: 'Mar 15' },
  { week: 'Week 6', score: 72, date: 'Mar 22' },
  { week: 'Week 7', score: 70, date: 'Mar 29' },
  { week: 'Week 8', score: 68, date: 'Apr 5' },
];

export const SUBJECT_PERFORMANCE = [
  {
    id: 'DS', name: 'Data Structures', faculty: 'Dr. R. K. Singh',
    marks: { obtained: 16, max: 40, label: '40%' },
    assignments: { completed: 3, total: 5 },
    status: 'At Risk', riskLevel: 'High',
    trend: [30, 45, 40] // array of percentages in last 3 assessments
  },
  {
    id: 'DELD', name: 'Digital Electronics', faculty: 'Prof. S. Nayak',
    marks: { obtained: 32, max: 40, label: '80%' },
    assignments: { completed: 4, total: 4 },
    status: 'Good', riskLevel: 'Low',
    trend: [75, 82, 80]
  },
  {
    id: 'OOP', name: 'Object Oriented Programming', faculty: 'Dr. V. Patel',
    marks: { obtained: 28, max: 40, label: '70%' },
    assignments: { completed: 3, total: 4 },
    status: 'Borderline', riskLevel: 'Medium',
    trend: [60, 65, 70]
  }
];

export const PENDING_ASSIGNMENTS = [
  { id: '1', title: 'Implement AVL Tree', subject: 'Data Structures', dueDate: '2026-04-20', maxMarks: 20 },
  { id: '2', title: 'File Handling Lab', subject: 'OOP', dueDate: '2026-04-22', maxMarks: 15 },
  { id: '3', title: 'Graph Traversal', subject: 'Data Structures', dueDate: '2026-04-25', maxMarks: 20 },
];

export const SUBJECT_DETAILS = {
  DS: {
    name: 'Data Structures',
    faculty: 'Dr. R. K. Singh',
    summary: 'You are currently struggling with programming assignments. Focus on trees and graphs concepts.',
    riskLevel: 'High',
    score: 42, // overall subject score out of 100
    assessments: [
      { name: 'Unit Test 1', max: 20, obtained: 12, date: '2026-02-25' },
      { name: 'Unit Test 2', max: 20, obtained: 4, date: '2026-03-20' },
    ],
    assignments: [
      { name: 'Array Operations', dueDate: '2026-02-10', status: 'On Time', marks: 18, max: 20 },
      { name: 'Linked List Implementation', dueDate: '2026-03-05', status: 'Late', marks: 12, max: 20 },
      { name: 'Stack & Queue', dueDate: '2026-03-25', status: 'Missing', marks: null, max: 20 },
      { name: 'Implement AVL Tree', dueDate: '2026-04-20', status: 'Pending', marks: null, max: 20 },
    ],
    trend: [
      { date: 'Week 1', performance: 80 },
      { date: 'Week 2', performance: 75 },
      { date: 'Week 4', performance: 60 },
      { date: 'Week 6', performance: 45 },
      { date: 'Week 8', performance: 42 },
    ]
  }
};

export const ALERTS = [
  { id: 'a1', title: 'CRITICAL RISK ALERT', message: 'Your attendance in Data Structures has fallen below the mandatory 75% threshold.', dateTime: '2 hours ago', priority: 'Critical', isRead: false },
  { id: 'a2', title: 'Missing Assignment', message: 'You have not submitted the "Stack & Queue" assignment for Data Structures.', dateTime: 'Yesterday', priority: 'High', isRead: false },
  { id: 'a3', title: 'Meeting Scheduled', message: 'Your mentor has scheduled a check-in meeting for tomorrow at 2:00 PM.', dateTime: '2 days ago', priority: 'Medium', isRead: true },
  { id: 'a4', title: 'Unit Test Marks Updated', message: 'Marks for OOP Unit Test 2 have been uploaded by Prof. V. Patel.', dateTime: '1 week ago', priority: 'Low', isRead: true },
];
