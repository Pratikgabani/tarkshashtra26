# Product Requirements Document (PRD)
# Early Academic Risk Detection & Student Intervention Platform

> **Problem ID:** TS-12 | **Organized By:** Dev IT Limited | **Version:** 1.0 | **Date:** April 2026
> **Platform:** Web Application | **Status:** Draft — Ready for Development

---

## Table of Contents

1. [Document Information](#1-document-information)
2. [Executive Summary](#2-executive-summary)
3. [Problem Statement & Root Causes](#3-problem-statement--root-causes)
4. [User Roles & Responsibilities](#4-user-roles--responsibilities)
5. [Academic Risk Score — Algorithm & Explanation](#5-academic-risk-score--algorithm--explanation)
6. [Feature 1 — Faculty Mentor Dashboard](#6-feature-1--faculty-mentor-dashboard)
7. [Feature 2 — Student Self-View Portal](#7-feature-2--student-self-view-portal)
8. [Feature 3 — Student Detailed Profile Page](#8-feature-3--student-detailed-profile-page)
9. [Feature 4 — Intervention Logging System](#9-feature-4--intervention-logging-system)
10. [Feature 5 — Pre/Post Intervention Comparison](#10-feature-5--prepost-intervention-comparison)
11. [Feature 6 — Subject Teacher Module](#11-feature-6--subject-teacher-module)
12. [Technical Architecture](#12-technical-architecture)
13. [Feature 7 — Automated Alert System](#13-feature-7--automated-alert-system)
14. [Feature 8 — Downloadable Reports](#14-feature-8--downloadable-reports)
15. [Hackathon Development Plan](#15-hackathon-development-plan)
16. [Non-Functional Requirements](#16-non-functional-requirements)
17. [Success Metrics & Winning Criteria Alignment](#17-success-metrics--winning-criteria-alignment)
18. [Glossary of Terms](#18-glossary-of-terms)

---

## 1. Document Information

| Field | Details |
|---|---|
| Document Title | Early Academic Risk Detection & Student Intervention Platform — PRD |
| Problem ID | TS-12 |
| Organized By | Dev IT Limited |
| Document Version | 1.0 |
| Target Platform | Web Application (Browser-based, Responsive) |
| Technology Stack | Frontend: React.js \| Backend: Node.js / Python \| DB: PostgreSQL \| Auth: JWT |
| Primary Users | Students, Faculty Mentors, Subject Teachers, Academic Coordinators |

### 1.1 Purpose of This Document

This Product Requirements Document (PRD) defines every feature, screen, workflow, and technical expectation for the Early Academic Risk Detection & Student Intervention Platform (hereafter referred to as the **"Platform"**). It is written to serve as a **single source of truth** for the hackathon development team.

Every team member — whether working on front-end design, back-end logic, database, or presentation — should refer to this document before starting any work. If something is not written here, it should be clarified before implementation begins.

### 1.2 How to Read This Document

- Sections 2–3 explain the background and the problem being solved.
- Section 4 defines who will use the system (user roles).
- Section 5 explains the risk scoring logic in detail.
- Sections 6–11 describe each major feature with screen-level detail.
- Section 12 covers technical architecture.
- Section 13 describes the alert system.
- Section 14 covers reporting.
- Section 15 gives the hackathon development timeline.

---

## 2. Executive Summary

Universities and colleges struggle with one serious and recurring problem: **academically at-risk students are identified too late**. By the time faculty notices that a student is struggling — through declining grades, poor attendance, or missed assignments — the student has already fallen behind significantly, and often feels discouraged or disengaged.

The existing systems in most educational institutions are fragmented. Attendance is tracked in one system. Internal assessment marks are in another. Assignment submissions go through a different portal. LMS activity (logins, video views, quiz attempts) lives in yet another tool. No single person or system is putting all of these signals together in real time to flag students who are at risk.

This Platform solves that problem. It aggregates all academic signals for every student, runs a multi-factor risk scoring algorithm, and presents the results in easy-to-understand dashboards for faculty and students alike. It also enables faculty to log their interventions (e.g., counselling sessions, remedial classes) and track whether those interventions actually helped the student improve.

### 2.1 What Makes This Platform Different

- It does **not just show a score** — it explains **WHY** a student is at risk (explainability).
- It is **actionable** — faculty can log interventions directly in the system.
- It **measures results** — before vs. after comparison shows whether interventions worked.
- It **sends automatic alerts** — mentors are notified before the situation gets critical.
- It **serves all stakeholders** — students, mentors, teachers, and coordinators each get their own view.

---

## 3. Problem Statement & Root Causes

### 3.1 The Core Problem

Academic risk detection in educational institutions is **reactive, not proactive**. The current process looks like this:

1. Student starts missing classes or skipping assignments.
2. This goes unnoticed because data is scattered across multiple systems.
3. Mid-term results come in and faculty realizes the student is struggling.
4. By this time, the student has already failed multiple assessments or lost motivation.
5. Counselling or remedial support is arranged — but often too late to make a real difference.

### 3.2 Root Causes (Detailed)

#### 3.2.1 Data Fragmentation
There is no unified view of a student's academic health. Attendance records, marks, assignments, and LMS usage are all stored separately. No one person has a complete picture without manually pulling data from multiple systems — which rarely happens in a timely manner.

#### 3.2.2 No Automated Risk Calculation
Faculty rely on subjective judgment or periodic manual reports to identify struggling students. There is no algorithm or automated tool that continuously monitors all academic indicators and generates an objective risk score for each student.

#### 3.2.3 Delayed Reporting Cycles
Academic reports (internal marks, attendance summaries) are generated at fixed intervals — typically mid-term and end-of-term. This means early warning signals are invisible to faculty until the reporting period arrives, at which point the damage is already done.

#### 3.2.4 No Intervention Tracking
Even when interventions are conducted (counselling, extra classes), there is no structured way to record what was done, when, and for which student. There is no way to measure whether the intervention was effective.

#### 3.2.5 Students Lack Self-Awareness
Students often do not realize how close they are to failing until they receive a failing grade. They have no dashboard or self-view portal that shows them their current academic health and what they need to do to improve.

### 3.3 Consequences of the Current Approach

| Consequence | Impact on Student | Impact on Institution |
|---|---|---|
| Late identification of risk | Student falls behind, loses motivation | Increased dropout rates |
| No intervention tracking | Repeat counselling without progress | Wasted faculty time and resources |
| No student self-view | Student unaware of own risk | Low student accountability |
| No data-driven decisions | Ad hoc academic support | Poor institutional outcomes |
| Scattered data systems | Inconsistent monitoring | No holistic academic picture |

---

## 4. User Roles & Responsibilities

The Platform serves **four distinct types of users**. Each user has a specific role, a unique dashboard, and a specific set of actions they can perform.

### 4.1 Student

#### Who They Are
Undergraduate or postgraduate students enrolled in a course at the institution. They may be in any semester, any department.

#### What They Can Do on the Platform
- Log in using their student ID and view their own personal academic risk score.
- See a clear breakdown of which factors are contributing to their risk (e.g., *"Your attendance is 58% — below the 75% threshold"*).
- View a list of pending or missed assignments.
- See subject-wise performance cards showing marks, completion rates, and trends.
- Receive personalized improvement suggestions (e.g., *"Attend at least 4 more classes this month to bring your attendance to 75%"*).
- Track their progress over time on a visual chart — showing risk score history week-by-week.
- View alerts and notifications sent to them.

#### What They Cannot Do
- Students **cannot** see other students' data.
- Students **cannot** modify their own academic records.
- Students **cannot** log interventions.

---

### 4.2 Faculty Mentor

#### Who They Are
A faculty member assigned as a personal mentor to a group of students (typically 15–30 students). They are responsible for academic guidance and support.

#### What They Can Do on the Platform
- View a dashboard listing all mentees with their current risk scores and risk levels (Low, Medium, High, Critical).
- Filter students by class, subject, risk level, or semester.
- Click on any student to see a detailed academic profile with all contributing risk factors explained.
- Log intervention actions against a specific student (e.g., *"Conducted counselling session on 15 Apr 2026 — discussed attendance issues"*).
- Set follow-up dates and add remarks for each intervention.
- View before-and-after performance comparison for students who have received interventions.
- Receive automated alerts when a mentee's risk crosses a threshold.
- Download a PDF/CSV report for any student.

---

### 4.3 Subject Teacher

#### Who They Are
A faculty member who teaches one or more specific subjects. They are responsible for academic delivery, assessments, and assignment grading.

#### What They Can Do on the Platform
- Upload or enter internal assessment marks for their subject.
- Mark each student's submission as: Submitted, Late, or Missing.
- View subject-wise performance trends — class average, bell curve of scores, percentage of students below threshold.
- Identify students who are struggling specifically in their subject.
- Flag students who need special attention (this flag appears on the mentor's dashboard).

---

### 4.4 Academic Coordinator

#### Who They Are
A senior administrator or Head of Department who oversees academic outcomes across the institution or a specific department.

#### What They Can Do on the Platform
- View institution-level or department-level risk analytics dashboards.
- See aggregate statistics: total students at risk, breakdown by class/department/subject.
- Monitor intervention effectiveness rates across the institution.
- Identify systemic patterns (e.g., *"Students in Semester 3 Mechanical Engineering consistently show low attendance in Subject X"*).
- Download comprehensive institutional reports in PDF or CSV format.
- Manage user accounts (create/edit student, teacher, and mentor profiles).

---

### 4.5 Role Capability Summary

| Capability | Student | Mentor | Teacher | Coordinator |
|---|:---:|:---:|:---:|:---:|
| View own risk score | ✔ | — | — | — |
| View all mentees' risk scores | — | ✔ | — | — |
| View subject-wise performance | Own only | ✔ | ✔ | ✔ |
| Log interventions | — | ✔ | — | — |
| Upload marks / assignments | — | — | ✔ | — |
| View institution analytics | — | — | — | ✔ |
| Download reports | Own only | ✔ | ✔ | ✔ |
| Manage user accounts | — | — | — | ✔ |
| Receive automated alerts | ✔ | ✔ | — | — |

---

## 5. Academic Risk Score — Algorithm & Explanation

The heart of this Platform is the **Academic Risk Score**. This section explains exactly how the score is calculated, what each factor means, and how the system communicates the reasons to users in plain language.

### 5.1 Overview of the Risk Score

Every student receives a **Risk Score on a scale of 0 to 100**. A higher score means higher risk. The score is recalculated every 24 hours (or whenever new data is entered). The score maps to four risk levels:

| Risk Level | Score Range | Color Code | Meaning |
|---|---|---|---|
| 🟢 Low Risk | 0 – 25 | Green | Student is performing well. No immediate action needed. |
| 🟡 Medium Risk | 26 – 50 | Yellow / Amber | Student shows some warning signs. Mentor should monitor closely. |
| 🟠 High Risk | 51 – 75 | Orange | Student is clearly struggling. Mentor should reach out and intervene. |
| 🔴 Critical Risk | 76 – 100 | Red | Student is in serious academic danger. Immediate intervention required. |

### 5.2 Risk Factors & Weights

The Risk Score is calculated using **five weighted academic indicators**. If a student's value for a factor falls below the threshold, that factor contributes to their risk score proportionally.

| # | Factor | Weight | Threshold | Data Source |
|---|---|---|---|---|
| 1 | Attendance Percentage | 30% | Below 75% | Attendance System / LMS |
| 2 | Internal Assessment Marks | 25% | Below 40% of max marks | Teacher Uploads / Assessment System |
| 3 | Assignment Completion Rate | 20% | Below 70% submitted | LMS / Teacher Records |
| 4 | LMS Activity (Login & Engagement) | 15% | Less than 3 logins/week | LMS Activity Logs |
| 5 | Assignment Submission Timeliness | 10% | More than 2 late submissions | LMS / Teacher Records |

### 5.3 Risk Score Calculation Formula

#### Step 1 — Normalize Each Factor
For each factor, calculate how far the student is from the threshold. Express this as a value between **0 and 1**, where 0 means no risk and 1 means worst possible.

> **Example — Attendance:** Threshold is 75%. Student has 50% attendance.
> Normalized risk = (75 - 50) / 75 = **0.33**
> If student has 80% attendance → Normalized risk = **0** (no risk from this factor)

#### Step 2 — Apply Weights
Multiply each normalized factor score by its weight.
> Attendance Risk = 0.33 × 0.30 = **0.099**

#### Step 3 — Sum All Weighted Scores
Add all weighted factor scores together to get a total value between 0 and 1.

#### Step 4 — Convert to 0–100 Scale
Multiply the total by 100 and round to the nearest whole number to get the final **Risk Score**.

#### Step 5 — Assign Risk Level
Based on the score, assign **Low / Medium / High / Critical** as described in Section 5.1.

---

### 5.4 Explanation Engine (Why Is This Student at Risk?)

A raw score without context is not useful. Every student's risk profile must include a **plain-language explanation** showing the top contributing factors, listed in descending order of contribution.

**Example output for a High-Risk student:**

| Rank | Reason | Current Value | Required Value | Contribution to Risk |
|---|---|---|---|---|
| #1 | Low Attendance | 52% | 75% | 38% of total risk |
| #2 | Missing Assignments | 3 of 8 submitted | All 8 submitted | 27% of total risk |
| #3 | Low Assessment Marks | 18 / 50 in Unit 2 | 20+ / 50 | 21% of total risk |
| #4 | Low LMS Activity | 1 login/week | 3 logins/week | 14% of total risk |

The Explanation Engine must display:
- The **top 3 contributing reasons** for every at-risk student (minimum).
- The **current value vs. expected value** for each reason.
- A **plain-English improvement suggestion** for each reason (e.g., *"Attend at least 5 more classes this month"*).

---

## 6. Feature 1 — Faculty Mentor Dashboard

### 6.1 Purpose
The Faculty Mentor Dashboard is the primary tool for mentors to monitor their assigned students. It must provide a **clear, filterable, and actionable** view of all mentees ranked by academic risk.

### 6.2 Page Layout
The dashboard is a single-page view with the following sections:
- **Top bar** — Mentor name, date, department, notification bell icon.
- **Summary cards** — Total Mentees | At-Risk Count | High/Critical Count | Pending Interventions.
- **Filter bar** — Filter by Class/Batch, Subject, Risk Level, Semester.
- **Student risk table** — Main content listing all mentees.
- **Quick-action buttons** — Per student row.

### 6.3 Student Risk Table — Column Definitions

| Column | Description | Format |
|---|---|---|
| Student Name | Full name, clickable to open profile | Text link |
| Student ID | Unique enrollment number | Text |
| Risk Score | Current numeric score (0–100) | Number + colored badge |
| Risk Level | Low / Medium / High / Critical | Color-coded pill label |
| Attendance % | Current attendance percentage | Number (red if below 75%) |
| Assignments Pending | Count of unsubmitted assignments | Number |
| Last Updated | When the risk score was last recalculated | Date/time |
| Actions | View Profile \| Log Intervention \| Send Alert | Button group |

### 6.4 Filters — Detailed Behavior

#### Class / Batch Filter
A dropdown listing all classes/batches assigned to the mentor. Selecting a class shows only students from that class. Default is **"All Classes"**.

#### Subject Filter
Filters the risk table to highlight students at risk specifically in a chosen subject. This uses subject-specific sub-scores rather than the overall score.

#### Risk Level Filter
A multi-select filter allowing the mentor to show only students of specific risk levels. For example, selecting **"High"** and **"Critical"** shows only the most urgent cases.

#### Semester Filter
Filters by semester. Useful for coordinators overseeing multiple batches.

### 6.5 Quick Actions
- **View Profile** — Opens the full student detail page (Section 8).
- **Log Intervention** — Opens a modal/popup to record an intervention without navigating away.
- **Send Alert** — Sends an email/SMS/in-app notification to the student. The mentor can edit the default alert message before sending.

---

## 7. Feature 2 — Student Self-View Portal

### 7.1 Purpose
The Student Self-View Portal allows students to see their own academic health clearly. The goal is to make students **self-aware and proactive** about their performance, rather than waiting to be called by their mentor.

### 7.2 Screen Elements

#### Risk Score Card (Top of Page)
A large, prominent card showing:
- Current Risk Score (e.g., **68 / 100**).
- Risk Level label in color (e.g., **HIGH RISK** in orange).
- Brief motivational message (e.g., *"You have the ability to improve. Focus on attendance first."*).
- Last updated timestamp.

#### Top Reasons Section
A visual breakdown of the top 3 contributing factors with icons, progress bars, and plain-English suggestions:
- Factor name (e.g., Attendance).
- Current value vs. required value with a progress bar (e.g., 58% ◄◄◄ 75%).
- Suggestion text (e.g., *"You need to attend 7 more classes to reach the 75% threshold."*).

#### Subject-Wise Performance Cards
One card per subject showing:
- Subject name.
- Internal marks earned vs. total marks.
- Assignment completion rate for this subject.
- A mini trend graph showing marks across the last 3 assessments.

#### Risk Score History Chart
A line chart showing the student's Risk Score over the past 8–12 weeks. Key events such as interventions are marked on the chart with an icon.

#### Notifications Panel
A list of recent notifications and alerts received by the student. Includes date/time, alert message content, and an action link (e.g., *"Book a session with your mentor"*).

### 7.3 Improvement Suggestions Logic

The system generates personalized suggestions for each student based on their specific gap. The suggestions are **direct, specific, and actionable** — not generic advice.

| Condition | Suggested Message Shown to Student |
|---|---|
| Attendance < 75% | *"Attend at least X more classes this month to reach 75% attendance."* |
| Assignments missing | *"You have Y pending assignments. Submit them before the deadline to avoid penalties."* |
| Low assessment marks | *"Your marks in [Subject] are below the passing threshold. Attend the next remedial session."* |
| Low LMS activity | *"Login to the LMS at least 3 times this week and review the materials for [Subject]."* |
| Multiple late submissions | *"You have Z late submissions. Contact your teacher to discuss deadline extensions."* |

---

## 8. Feature 3 — Student Detailed Profile Page

### 8.1 Purpose
When a faculty mentor clicks on a student's name from the dashboard, they are taken to that student's **detailed academic profile**. This page provides a 360-degree view of the student's academic health, intervention history, and performance trajectory.

### 8.2 Page Sections

#### Section A — Student Identity Block
Student photo (if available), full name, student ID, class/batch, department, semester, enrolled subjects, and assigned mentor name.

#### Section B — Risk Overview Block
Current risk score with color badge, risk level label, date of last calculation, trend indicator (↑ worsening / ↓ improving), and a short one-line explanation (e.g., *"Primarily driven by low attendance and 3 missing assignments"*).

#### Section C — Factor Breakdown Table
A detailed table showing all 5 risk factors with current value, threshold, gap, and individual contribution percentage. Same as the Explanation Engine output described in Section 5.4.

#### Section D — Subject-Wise Analysis
Expandable cards for each subject showing: all assessment scores, assignment list with submission status, and subject-specific risk sub-score.

#### Section E — Intervention History Timeline
A chronological list of all interventions conducted for this student. Each entry shows: date, type of intervention, mentor name, remarks, and outcome (if recorded). See Section 9 for full details.

#### Section F — Pre/Post Intervention Comparison
This section appears only when at least one intervention has been recorded. It shows a side-by-side comparison of the student's risk score and factor values before and after the intervention. See Section 10 for full details.

#### Section G — Risk Score History Chart
Full-size line chart showing risk score over time with intervention markers. Faculty can hover over any point to see the score value and the date.

---

## 9. Feature 4 — Intervention Logging System

### 9.1 Purpose
The Intervention Logging System allows faculty mentors to record all academic support actions they take for at-risk students. This creates a **structured, searchable, and auditable** record of all interventions and makes performance improvement tracking possible.

### 9.2 Intervention Types

The system supports the following predefined intervention types (plus an "Other" option):

- **Counselling Session** — Individual meeting with student to discuss academic concerns.
- **Remedial Class** — Additional teaching session for a specific subject or topic.
- **Assignment Extension** — Granting extra time for a pending assignment.
- **Parental Notification** — Contacting parent/guardian about academic status.
- **Study Plan Creation** — Creating a customized study schedule for the student.
- **Peer Tutoring Arranged** — Connecting the student with a peer tutor.
- **Other** — Free-text description.

### 9.3 Intervention Log Entry Form

When a mentor clicks "Log Intervention" for a student, a form opens with the following fields:

| Field | Type | Required? | Description |
|---|---|---|---|
| Student Name | Auto-filled (read-only) | Yes | Prefilled from the student profile being viewed |
| Intervention Date | Date picker | Yes | Date on which the intervention was conducted |
| Intervention Type | Dropdown | Yes | Select the type of intervention |
| Subject (if applicable) | Dropdown | No | Which subject this intervention relates to |
| Description / Remarks | Text area (500 chars) | Yes | Detailed notes on what was discussed or decided |
| Outcome | Dropdown (Positive / Neutral / Negative / Pending) | Yes | Initial assessment of intervention outcome |
| Follow-up Date | Date picker | No | If a follow-up session is planned |
| Follow-up Reminder | Toggle (Yes/No) | No | If Yes, system sends reminder to mentor on follow-up date |

### 9.4 Post-Submission Behavior
After a mentor saves an intervention log entry:
- The intervention is stored with a timestamp and attributed to the mentor's user account.
- The intervention appears in the **Intervention History Timeline** on the student's profile.
- The intervention is **marked on the risk score history chart** as a visible event.
- If the outcome is "Pending" and a follow-up date is set, the system schedules an automatic reminder.
- The student's risk score is recalculated at the next scheduled cycle and compared against the pre-intervention baseline.

### 9.5 Viewing and Editing Intervention Logs
- Mentors can view all intervention logs from their dashboard under an **"Intervention History"** tab.
- Logs can be filtered by date range, student name, intervention type, and outcome.
- Mentors can **edit** the remarks and outcome of a log entry (but not the date or student).
- Logs **cannot be deleted** once saved — they can only be marked as "Voided" with a reason (to maintain audit trail integrity).
- Academic Coordinators can view all intervention logs across the institution.

---

## 10. Feature 5 — Pre/Post Intervention Comparison

### 10.1 Purpose
The Pre/Post Intervention Comparison feature provides a **data-driven answer** to whether interventions actually work, by comparing a student's academic performance before and after each logged intervention.

### 10.2 How It Works

#### Baseline Capture
When an intervention is logged, the system automatically saves a **snapshot** of the student's academic metrics at that point in time. This becomes the **"Before"** baseline. The snapshot includes:
- Overall Risk Score at the time of intervention.
- Attendance percentage at the time of intervention.
- Internal marks earned in each subject up to that date.
- Assignment completion rate at that time.
- LMS activity level at that time.

#### Post-Intervention Measurement
The system measures the student's metrics again **2 weeks after the intervention date** (configurable by coordinator). This becomes the **"After"** snapshot.

### 10.3 Comparison Display

| Metric | Before Intervention | After Intervention | Change |
|---|---|---|---|
| Overall Risk Score | 72 (High) | 54 (Medium) | ▼ -18 ✅ Improved |
| Attendance % | 52% | 71% | ▲ +19% ✅ Improved |
| Assignment Completion | 5 / 10 | 8 / 10 | ▲ +3 submitted ✅ Improved |
| Avg. Internal Marks | 31% | 48% | ▲ +17% ✅ Improved |
| LMS Logins / Week | 1 | 3 | ▲ +2 per week ✅ Improved |

> Each change is **color-coded**: 🟢 green for improvement, 🔴 red for worsening, ⚪ grey for no change.
> If the comparison window has not yet passed, the system displays: *"Post-intervention data will be available in X days."*

### 10.4 Institution-Level Effectiveness Metrics
Academic Coordinators can see a summary across the institution:
- Total interventions logged in the selected period.
- Percentage of interventions that resulted in a measurable risk score improvement.
- Average risk score reduction after intervention (by type).
- Breakdown of outcomes: Positive / Neutral / Negative / Still Pending.
- Most effective intervention types ranked by average improvement.

---

## 11. Feature 6 — Subject Teacher Module

### 11.1 Purpose
The Subject Teacher Module allows teachers to **input and manage the raw academic data** that feeds the risk scoring engine. Teachers are the primary data entry points for marks and assignment data.

### 11.2 Data Entry Capabilities

#### Internal Assessment Mark Entry
- Enter marks for each assessment type: Unit Test 1, Unit Test 2, Mid-term Exam, End-term Exam (configurable by coordinator).
- Marks are entered per student in a **spreadsheet-style grid view** — all students visible at once.
- System validates that marks do not exceed the maximum marks defined.
- **Bulk upload supported** via CSV file template.

#### Assignment Management
- Create an assignment with a title, description, subject, due date, and maximum marks.
- Mark each student's submission as: **Submitted On Time | Submitted Late | Not Submitted**.
- Assign marks for submitted assignments.
- Bulk status update supported.

### 11.3 Subject Performance Dashboard
Each teacher has access to a subject-level performance dashboard showing:
- Class average for each assessment.
- Distribution chart (bar chart showing how many students scored in each 10% range).
- List of students below passing threshold (highlighted in red).
- Assignment submission rate (e.g., *"6 out of 32 students have not submitted Assignment 3"*).
- Subject-wise risk summary: count of students at Low / Medium / High / Critical risk in this subject.

### 11.4 Student Flagging
Teachers can manually flag a student as needing attention. This flag:
- Appears as a ⚠️ warning icon next to the student on the mentor's dashboard.
- Includes an optional short note from the teacher (e.g., *"Student appears disengaged in class"*).
- Triggers a notification to the assigned mentor.
- Is cleared once the mentor logs an intervention for the student.

---

## 12. Technical Architecture

### 12.1 System Architecture Overview

The Platform follows a **three-tier web application architecture**:

- **Presentation Layer (Frontend)** — React.js single-page application. Responsive design for desktop and tablet. Separate views/dashboards for each user role.
- **Application Layer (Backend)** — Node.js / Express.js REST API. Risk scoring engine runs as a scheduled job (cron). Authentication via JWT tokens with role-based access control (RBAC).
- **Data Layer (Database)** — PostgreSQL relational database. Separate tables for students, marks, attendance, assignments, interventions, and alerts. Historical snapshots stored for pre/post comparison.

### 12.2 Key Database Tables

| Table Name | Key Columns | Purpose |
|---|---|---|
| `students` | student_id, name, batch, semester, department, mentor_id | Core student information |
| `attendance` | student_id, subject_id, date, status | Daily attendance records |
| `assessments` | student_id, subject_id, assessment_type, marks_obtained, max_marks | Internal marks records |
| `assignments` | assignment_id, student_id, subject_id, due_date, status, marks | Assignment tracking |
| `lms_activity` | student_id, date, login_count, pages_viewed, time_spent | LMS engagement data |
| `risk_scores` | student_id, score, risk_level, calculated_at, factors_json | Calculated risk scores with factor breakdown |
| `interventions` | intervention_id, student_id, mentor_id, type, date, remarks, outcome | Intervention log records |
| `score_snapshots` | student_id, intervention_id, snapshot_type, score, metrics_json | Pre/post comparison data |
| `alerts` | alert_id, student_id, mentor_id, type, message, sent_at, status | Alert records |

### 12.3 Risk Scoring Engine
- Runs as a **scheduled background job every 24 hours** at midnight (configurable).
- Also triggered **on-demand** when new marks or attendance data is entered.
- Processes all students in batches to manage system load.
- Results written to the `risk_scores` table with a timestamp.
- All factor values stored as JSON in the `factors_json` column for use by the Explanation Engine.

### 12.4 Security & Access Control
- All API endpoints are protected by **JWT authentication**.
- **Role-Based Access Control (RBAC)** ensures each user type can only access their authorized data.
- Students can only access data where `student_id` matches their own.
- Mentors can only access data for students assigned to them.
- All sensitive data (passwords) are hashed using **bcrypt**.
- **HTTPS enforced** for all communication.

### 12.5 Integration Points
> For hackathon demo, mock data can be used. For production, the following integrations are defined:

- **LMS Integration** — REST API or CSV import from the institution's LMS (e.g., Moodle, Brightspace).
- **Attendance System** — API or file-based import from biometric/RFID attendance systems.
- **Email/SMS Gateway** — Integration with SendGrid (email) and Twilio (SMS) for automated alerts.
- **Authentication** — Optional SSO integration with institutional Google Workspace or Microsoft 365.

---

## 13. Feature 7 — Automated Alert System

### 13.1 Purpose
The Automated Alert System ensures that faculty mentors are notified of high-risk students **before the situation becomes irreversible** — ideally 2–4 weeks before major examinations. The system operates without requiring any manual monitoring.

### 13.2 Alert Triggers

| Trigger Condition | Alert Recipient | Priority | Channel |
|---|---|---|---|
| Risk score crosses 51 (enters High Risk) | Assigned Mentor | 🟠 High | In-App + Email |
| Risk score crosses 76 (enters Critical Risk) | Mentor + Coordinator | 🔴 Critical | In-App + Email + SMS |
| Attendance drops below 65% | Assigned Mentor | 🟠 High | In-App + Email |
| Student misses 3+ consecutive assignments | Assigned Mentor | 🟡 Medium | In-App |
| No LMS login for 7 consecutive days | Assigned Mentor | 🟡 Medium | In-App + Email |
| Major exam is 14 days away and student is High Risk | Mentor + Student | 🟠 High | In-App + Email |
| Intervention follow-up date is tomorrow | Assigned Mentor | 🟢 Low | In-App + Email |
| Score worsens after an intervention | Mentor + Coordinator | 🟠 High | In-App + Email |

### 13.3 Alert Message Structure
Each alert contains:
- Alert heading (e.g., **"CRITICAL RISK ALERT — Immediate Action Required"**).
- Student name and ID.
- Current risk score and risk level.
- Brief explanation of what triggered the alert.
- Top 2 contributing factors in plain English.
- A **direct call-to-action link** (e.g., *"Click here to view student profile and log an intervention"*).
- Estimated time to major exam (if applicable).

### 13.4 Alert Management
- Mentors can view all alerts in a dedicated **Alerts Inbox** inside the Platform.
- Alerts can be marked as **Acknowledged** or **Actioned**.
- An alert is automatically marked Actioned when the mentor logs an intervention for the same student within 3 days.
- Coordinators can see **overdue alerts** — alerts not actioned within 5 days.
- **Alert throttling** — The system will not send more than 2 alerts per student per week to avoid notification fatigue.

---

## 14. Feature 8 — Downloadable Reports

### 14.1 Available Report Types

#### Individual Student Risk Summary (PDF)
A single-page PDF report for one student containing: student details, current risk score, risk level, top contributing factors with values, intervention history summary, and pre/post comparison (if applicable).
> **Useful for:** Sharing with parents, faculty meetings, student review sessions.

#### Class-Wise At-Risk Students Report (PDF/CSV)
A report listing all at-risk students in a class or batch, sorted by risk level. Columns: student name, ID, risk score, risk level, top 2 reasons, last intervention date.
> **Useful for:** Class review meetings, batch-level academic planning.

#### Subject Performance Report (PDF/CSV)
A report showing subject-wise performance analysis: class average marks per assessment, assignment submission rates, count of students below threshold.
> **Useful for:** Subject-level curriculum review, identifying weak topics.

#### Intervention Effectiveness Report (PDF/CSV)
A summary report of all interventions in a time period with outcomes and score changes.
> **Useful for:** Academic coordinators to measure the ROI of mentoring efforts.

#### Institution Dashboard Export (CSV)
A full data export of risk scores, factor values, and intervention data for all students.
> **Useful for:** External academic audits, higher management reporting.

### 14.2 Report Generation Flow
1. User selects report type and parameters (student ID, class, date range, etc.).
2. System queries the database and assembles the required data.
3. For PDF reports: A templated PDF is generated server-side (using PDFKit or Puppeteer).
4. For CSV reports: Data is formatted into CSV and served as a file download.
5. User sees a download prompt in the browser.
6. A log entry is created recording who downloaded which report and when (audit trail).

---

## 15. Hackathon Development Plan

### 15.1 What to Build for the Demo

In a 24-hour hackathon, focus on showcasing the core functionality that demonstrates the platform's value.

| Priority | Feature | Why It's Essential for Demo |
|---|---|---|
| **P0 — Must Have** | Risk Score Calculation Engine | Core of the entire system — without this nothing works |
| **P0 — Must Have** | Faculty Mentor Dashboard (filtered view) | The most impactful UI for evaluators to see |
| **P0 — Must Have** | Explanation Engine (top reasons display) | Differentiates this from a simple score system |
| **P1 — Should Have** | Student Self-View Portal | Shows the student-facing value of the system |
| **P1 — Should Have** | Intervention Logging Form | Demonstrates the actionability of the platform |
| **P1 — Should Have** | Pre/Post Comparison Display | Shows measurable impact — very compelling for judges |
| **P2 — Nice to Have** | Automated Alert System (mock) | Can be simulated/shown as a mockup |
| **P2 — Nice to Have** | Downloadable Report (PDF/CSV) | Clean deliverable to demonstrate completeness |
| **P3 — Stretch** | Academic Coordinator Dashboard | Add only if time permits |

### 15.2 Suggested Team Division (4-person team)

| Team Member | Responsibilities |
|---|---|
| Member 1 — Backend Lead | Database setup, API development, Risk scoring engine, Alert triggers |
| Member 2 — Frontend Lead | React app setup, Faculty Dashboard UI, filter/table components |
| Member 3 — Full-Stack Support | Student self-view portal, Intervention logging form, Pre/post comparison UI |
| Member 4 — Data & Presentation | Mock data generation, PDF report, Demo script preparation, Slide deck |

### 15.3 Mock Data Required for Demo
- 20 students across 2 batches (CE-A and CE-B), Semester 3.
- 3 subjects: Data Structures, Mathematics III, Operating Systems.
- Attendance data for the past 8 weeks (generate mix of 50%–90% attendance per student).
- 3 assessment results per subject (Unit 1, Unit 2, Mid-term).
- Assignment data: 3 assignments per subject, mix of submitted/late/missing.
- **5 students in High/Critical risk range** for demo impact.
- 3 pre-logged interventions with post-comparison data showing improvement.
- 2 unactioned alerts in the Alerts inbox.

---

## 16. Non-Functional Requirements

### 16.1 Performance
- Dashboard must load in under **3 seconds** for up to 500 concurrent users.
- Risk score recalculation for 1,000 students must complete within **5 minutes**.
- PDF report generation must complete within **10 seconds** per report.

### 16.2 Usability
- All dashboards must be usable on laptop screens (1280px width and above) without horizontal scrolling.
- Font sizes must be minimum **14px** for body text, **16px** for headings, to ensure readability.
- Color-coded risk levels must also use **icons/labels** for accessibility (not color alone).
- All forms must show clear validation error messages when required fields are missing.

### 16.3 Data Integrity
- Risk scores must be **versioned** — old scores must not be overwritten, only new entries added.
- All user actions (logins, interventions, downloads) must be logged for **audit purposes**.
- Database must use **foreign key constraints** to prevent orphaned records.

### 16.4 Reliability
- The alert system must have a **retry mechanism** — if an email/SMS fails, retry up to 3 times before marking as failed.
- Risk scoring engine must **handle missing data gracefully** — if attendance data for a subject is absent, use a neutral score for that factor rather than failing.

---

## 17. Success Metrics & Winning Criteria Alignment

| Winning Logic Criterion | How This Platform Satisfies It | Key Feature |
|---|---|---|
| Multi-factor risk scoring | 5-factor weighted algorithm (attendance, marks, assignments, LMS activity, timeliness) | Section 5 — Risk Score Engine |
| Explainable insights | Top 3 contributing reasons shown in plain English with current vs. required values | Section 5.4 — Explanation Engine |
| Actionable faculty dashboard | Filterable table by class, subject, risk level with quick-action buttons | Section 6 — Faculty Dashboard |
| Intervention recording | Structured form with type, date, remarks, outcome, and follow-up date fields | Section 9 — Intervention Logging |
| Performance improvement tracking | Before/after snapshot comparison with color-coded change indicators | Section 10 — Pre/Post Comparison |
| Timely alerts | Automatic triggers on risk level crossing, exam proximity, and attendance drop | Section 13 — Alert System |

### 17.1 Demo Evaluation Checklist
Use this checklist during your hackathon demo to ensure all judging criteria are covered:

- [ ] Show risk score on student profile — explain it is a 5-factor weighted calculation.
- [ ] Show explanation section with top reasons and plain-English descriptions.
- [ ] Demonstrate faculty dashboard filters — filter by High/Critical risk.
- [ ] Click on a high-risk student and walk through their full profile.
- [ ] Log a new intervention for a student using the modal form.
- [ ] Show the pre/post comparison table for a student who previously received an intervention.
- [ ] Show the alerts inbox — demonstrate an unactioned critical alert.
- [ ] Download a PDF/CSV report for the class.
- [ ] Show the student self-view portal — student sees their own score and improvement suggestions.

---

## 18. Glossary of Terms

| Term | Definition |
|---|---|
| **Academic Risk Score** | A numeric value (0–100) representing how likely a student is to face academic failure, calculated from multiple weighted indicators. |
| **At-Risk Student** | A student with a Risk Score above 25 (Medium, High, or Critical risk level). |
| **Explanation Engine** | The component that translates a risk score into plain-language reasons with current and required values. |
| **Intervention** | Any action taken by a mentor to support an at-risk student, such as counselling, remedial class, or assignment extension. |
| **Pre/Post Comparison** | A side-by-side data comparison of a student's academic metrics before and after an intervention was conducted. |
| **LMS** | Learning Management System — the digital platform used by the institution for course content, assignments, and learning activities (e.g., Moodle). |
| **RBAC** | Role-Based Access Control — a security model that restricts system access based on the user's assigned role. |
| **Risk Level** | A categorical classification of risk: Low (0–25), Medium (26–50), High (51–75), Critical (76–100). |
| **Snapshot** | A point-in-time capture of a student's academic metrics, stored permanently for comparison purposes. |
| **Threshold** | The minimum acceptable value for a given academic indicator below which a factor contributes to risk. |
| **Faculty Mentor** | A faculty member assigned to personally guide and support a group of students academically. |
| **Subject Teacher** | A faculty member responsible for teaching a specific subject and entering marks/assignment data. |
| **Academic Coordinator** | A senior administrator who oversees academic outcomes at the department or institution level. |

---

*— End of Document —*

*PRD v1.0 | Early Academic Risk Detection & Student Intervention Platform | Dev IT Limited | April 2026*