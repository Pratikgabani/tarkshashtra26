"use client";

import Link from "next/link";

function LiveDataPanel() {
  return (
    <div className="live-panel rounded-2xl border border-gray-200/70 bg-white/85 shadow-[0_22px_48px_rgba(15,23,42,0.10)] overflow-hidden text-sm backdrop-blur-[2px]">
      <div className="border-b border-gray-100 bg-white/80 px-4 py-3">
        <p className="font-semibold text-gray-800 text-xs">
          Live Data Pipeline
        </p>
        <p className="text-gray-400 text-xs">
          All dashboard views load from MongoDB-backed APIs
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {["Attendance", "Assessments", "Assignments", "LMS Activity"].map(
            (source) => (
              <div
                key={source}
                className="live-chip rounded-xl border border-gray-200/70 bg-white/75 px-3 py-2"
              >
                <p className="text-[11px] font-semibold text-gray-700">
                  {source}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Fetched in real time
                </p>
              </div>
            ),
          )}
        </div>

        <div className="rounded-xl border border-blue-100/80 bg-blue-50/70 p-3">
          <p className="text-xs font-semibold text-blue-800">
            No hardcoded dashboard records
          </p>
          <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
            Mentors, students, teachers, and coordinators see records sourced
            from database APIs, with empty/error states shown when data is
            unavailable.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/70 bg-white/70 p-3">
          <p className="text-[11px] font-semibold text-gray-800">
            Risk scoring flow
          </p>
          <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
            Risk Score = 0.4 × (100 - Attendance%) + 0.3 × (100 - Marks%) + 0.2
            × (100 - Assignment%) + 0.1 × (100 - LMS Engagement%).
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm tracking-tight">
            ShikshaSetu
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-gray-900 transition-colors"
          >
            How It Works
          </a>
          <a href="#roles" className="hover:text-gray-900 transition-colors">
            Roles
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition-colors font-medium"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span className="text-blue-700 text-xs font-medium">
                  Academic Risk Intelligence Platform
                </span>
              </div>
              <h1 className="text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-4">
                Identify At-Risk Students
                <br />
                <span className="text-blue-600">Before It&apos;s Too Late</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                Track attendance, marks, assignments, and LMS engagement in one
                place. Get early risk warnings and take action before students
                fall behind.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  View Demo Dashboard
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Explore How It Works
                </a>
              </div>
              {/* Trust indicators */}
              <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70" />
                  4-Factor Risk Formula
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70" />
                  Role-Based Access
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500/70" />
                  Automated Alerts
                </div>
              </div>
            </div>

            {/* Right - Live Data Overview */}
            <div className="hero-panel-shell relative lg:pl-4">
              <LiveDataPanel />
              {/* Alert banner floating */}
              <div className="hero-alert absolute -bottom-4 -left-4 bg-white/90 border border-gray-200/80 rounded-xl px-3 py-2 shadow-[0_14px_32px_rgba(15,23,42,0.10)] flex items-start max-w-xs backdrop-blur-[2px]">
                <div>
                  <p className="text-xs font-semibold text-gray-800">
                    High-Risk Alert
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mentors are notified when a student enters high risk so
                    intervention can begin immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#F9FAFB] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2">
              The Problem
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Why Students Slip Through the Cracks
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
              By the time faculty notices a student is at risk, they&apos;ve
              already fallen significantly behind. The root cause is always the
              same — fragmented data and delayed action.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Data is scattered",
                desc: "Attendance, marks, and LMS data live in separate systems. No one sees the full picture.",
              },
              {
                title: "No early warning system",
                desc: "Reports are generated at fixed intervals. Warning signals are invisible between cycles.",
              },
              {
                title: "Intervention is too late",
                desc: "By the time counselling is arranged, students have already lost motivation and missed exams.",
              },
              {
                title: "Students are unaware",
                desc: "Students don&apos;t know they are at risk until they receive a failing grade. No self-awareness portal exists.",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="premium-card bg-white/80 border border-gray-200/70 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-[1px]"
              >
                <span className="block h-0.5 w-8 rounded-full bg-orange-300/80 mb-4" />
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">
                  {p.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="scroll-mt-24 py-16 bg-white border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
              How It Works
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              A Single System That Connects Everything
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                title: "Collect Data",
                desc: "Attendance records, internal marks, assignment submissions, and LMS login activity are all aggregated in one place — automatically.",
                tags: ["Attendance", "Marks", "Assignments", "LMS Activity"],
              },
              {
                step: "2",
                title: "Calculate Risk",
                desc: "A 4-factor weighted formula generates an objective Risk Score (0–100) for every student using attendance, marks, assignment, and LMS engagement percentages.",
                tags: [
                  "40% Attendance",
                  "30% Marks",
                  "20% Assignment",
                  "10% LMS Engagement",
                ],
              },
              {
                step: "3",
                title: "Take Action",
                desc: "Mentors receive alerts, log interventions, and track improvement. Students see personalized suggestions. Coordinators monitor trends.",
                tags: [
                  "Alerts",
                  "Interventions",
                  "Reports",
                  "Progress Tracking",
                ],
              },
            ].map((step) => (
              <div
                key={step.step}
                className="premium-card bg-[#F9FAFB]/75 border border-gray-200/70 rounded-2xl p-6 relative shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="step-badge">
                  <span className="step-badge-number">
                    {step.step.padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {step.desc}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {step.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-white/80 border border-gray-200/70 text-gray-600 px-2.5 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="scroll-mt-24 py-16 bg-[#F9FAFB] border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
              Features
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Everything You Need, Nothing You Don&apos;t
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "Faculty Mentor Dashboard",
                desc: "Filterable student table with risk scores, attendance, pending assignments, and quick-action buttons per student.",
              },
              {
                title: "Student Self-View Portal",
                desc: "Students see their own risk score, top contributing factors, and specific, actionable improvement suggestions.",
              },
              {
                title: "Risk Score + Explanation",
                desc: "Every score includes a plain-English breakdown showing WHY the student is at risk — with current vs. required values.",
              },
              {
                title: "Intervention Logging",
                desc: "Mentors log counselling sessions, remedial classes, and study plans against specific students with outcome tracking.",
              },
              {
                title: "Pre / Post Comparison",
                desc: "Automatically compare a student's academic metrics before and after an intervention to measure real impact.",
              },
              {
                title: "Automated Alert System",
                desc: "Mentors are notified when risk crosses thresholds, attendance drops, or follow-up dates are approaching.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="premium-card bg-white/80 border border-gray-200/70 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-[1px] hover:border-blue-200/80 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)] transition-all"
              >
                <span className="block h-0.5 w-8 rounded-full bg-blue-300/80 mb-4" />
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">
                  {f.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────────────────────── */}
      <section
        id="roles"
        className="scroll-mt-24 py-16 bg-white border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
              User Roles
            </p>
            <h2 className="text-2xl font-bold text-gray-900">
              Built for Every Person in the Academic Chain
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: "Student",
                color: "border-t-blue-500",
                capabilities: [
                  "View personal risk score",
                  "See top contributing factors",
                  "Get actionable improvement tips",
                  "Track progress over time",
                  "View subject-wise performance",
                ],
              },
              {
                role: "Faculty Mentor",
                color: "border-t-orange-500",
                capabilities: [
                  "Monitor all assigned mentees",
                  "Filter by risk level & class",
                  "Log counselling interventions",
                  "Compare before/after impact",
                  "Receive automated risk alerts",
                ],
              },
              {
                role: "Subject Teacher",
                color: "border-t-purple-500",
                capabilities: [
                  "Enter assessment marks (grid view)",
                  "Manage assignment submissions",
                  "View class performance trends",
                  "Identify students below threshold",
                  "Flag students for mentor attention",
                ],
              },
              {
                role: "Academic Coordinator",
                color: "border-t-green-500",
                capabilities: [
                  "View institution-level analytics",
                  "Monitor intervention effectiveness",
                  "Identify systemic risk patterns",
                  "Manage all user accounts",
                  "Download comprehensive reports",
                ],
              },
            ].map((r) => (
              <div
                key={r.role}
                className={`premium-card bg-[#F9FAFB]/80 border border-gray-200/70 border-t-4 ${r.color} rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-[1px]`}
              >
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                  {r.role}
                </h3>
                <ul className="space-y-2">
                  {r.capabilities.map((c) => (
                    <li
                      key={c}
                      className="flex items-start gap-2 text-xs text-gray-600"
                    >
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400/80 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IMPACT ───────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#0F172A] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">
              Impact
            </p>
            <h2 className="text-2xl font-bold text-white">
              From Reactive to Proactive Academic Support
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-700 rounded-lg overflow-hidden">
            {[
              {
                value: "3–4 wks",
                title: "Earlier Detection",
                desc: "Struggling students can be identified weeks before major exams.",
              },
              {
                value: "↓ 40%",
                title: "Lower Blind Spots",
                desc: "Undetected at-risk student cases can be reduced significantly.",
              },
              {
                value: "100%",
                title: "Intervention Auditability",
                desc: "Every mentor action is tracked with a clear timeline and outcomes.",
              },
              {
                value: "2×",
                title: "Faster Responses",
                desc: "Faculty can respond to high-risk students nearly twice as fast.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="premium-card bg-[#1E293B]/90 border border-[#334155]/80 px-6 py-8"
              >
                <span className="block h-0.5 w-10 rounded-full bg-blue-400/70 mb-4" />
                <p className="text-3xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-sm font-semibold text-blue-100 mb-1">
                  {s.title}
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE INSIGHT ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                Explainable Insights
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Not Just a Score — An Explanation
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Every risk score comes with a plain-English breakdown. Faculty
                and students always know <em>why</em> the score is what it is,
                and exactly what needs to change.
              </p>
              <ul className="space-y-3 text-sm text-gray-600">
                {[
                  "Top 3 contributing risk factors always shown",
                  "Current value vs. required threshold for each factor",
                  "Specific, actionable improvement suggestion per factor",
                  "Factor contribution shown as percentage of total risk",
                ].map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500/80 shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sample Risk Card */}
            <div className="premium-card bg-[#F9FAFB]/85 border border-gray-200/70 rounded-2xl overflow-hidden shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              {/* Risk header */}
              <div className="bg-white/85 border-b border-gray-200/70 px-5 py-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Arjun Mehta
                  </p>
                  <p className="text-xs text-gray-500">
                    CE2301 · Batch CE-A · Semester 3
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">68</div>
                  <div className="text-xs text-red-600 font-medium">
                    HIGH RISK
                  </div>
                </div>
              </div>
              {/* Risk factors */}
              <div className="p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Top Contributing Factors
                </p>
                {[
                  {
                    rank: 1,
                    reason: "Low Attendance",
                    current: "52%",
                    required: "75%",
                    contrib: "38%",
                    bad: true,
                  },
                  {
                    rank: 2,
                    reason: "Missing Assignments",
                    current: "3 of 8 submitted",
                    required: "All 8",
                    contrib: "27%",
                    bad: true,
                  },
                  {
                    rank: 3,
                    reason: "Low Assessment Marks",
                    current: "18/50 in Unit 2",
                    required: "20+/50",
                    contrib: "21%",
                    bad: true,
                  },
                  {
                    rank: 4,
                    reason: "Low LMS Activity",
                    current: "1 login/week",
                    required: "3/week",
                    contrib: "14%",
                    bad: true,
                  },
                ].map((f) => (
                  <div
                    key={f.rank}
                    className="premium-card bg-white/85 border border-gray-200/70 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">
                          #{f.rank}
                        </span>
                        <span className="text-xs font-semibold text-gray-800">
                          {f.reason}
                        </span>
                      </div>
                      <span className="text-xs text-orange-600 font-semibold">
                        {f.contrib} of risk
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-red-600 font-medium">
                        {f.current}
                      </span>
                      <span>→ required:</span>
                      <span className="font-medium text-gray-700">
                        {f.required}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Suggestion */}
                <div className="premium-card bg-blue-50/70 border border-blue-100/80 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">
                    Suggested Action
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Attend at least 5 more classes this month and submit 5
                    pending assignments to reduce risk score below the High
                    threshold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0F172A] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-white text-sm">
                  ShikshaSetu
                </span>
              </div>
              <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                Early Academic Risk Detection &amp; Student Intervention
                Platform. Built for universities that care about outcomes.
              </p>
            </div>
            <div className="flex gap-6 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">
                About
              </a>
              <a
                href="#features"
                className="hover:text-gray-300 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="hover:text-gray-300 transition-colors"
              >
                How It Works
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
            © 2026 ShikshaSetu · Early Academic Risk Detection &amp; Student
            Intervention Platform · Dev IT Limited
          </div>
        </div>
      </footer>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .hero-panel-shell {
          position: relative;
          transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1);
          transform-origin: center top;
        }

        .hero-panel-shell::before {
          content: "";
          position: absolute;
          inset: -16px;
          border-radius: 28px;
          background: radial-gradient(
            circle at 50% 30%,
            rgba(37, 99, 235, 0.14),
            rgba(37, 99, 235, 0)
          );
          opacity: 0;
          transition: opacity 360ms ease;
          pointer-events: none;
        }

        .hero-panel-shell:hover {
          transform: translateY(-8px) scale(1.04);
        }

        .hero-panel-shell:hover::before {
          opacity: 1;
        }

        .live-panel {
          transition:
            transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 420ms ease,
            border-color 420ms ease;
        }

        .hero-panel-shell:hover .live-panel {
          transform: translateY(-4px);
          border-color: rgba(37, 99, 235, 0.3);
          box-shadow: 0 28px 60px rgba(37, 99, 235, 0.16);
        }

        .live-chip {
          transition:
            transform 320ms ease,
            border-color 320ms ease,
            background-color 320ms ease;
        }

        .hero-panel-shell:hover .live-chip {
          transform: translateY(-2px);
          border-color: rgba(37, 99, 235, 0.28);
          background-color: rgba(255, 255, 255, 0.95);
        }

        .hero-alert {
          transition:
            transform 360ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 360ms ease;
        }

        .hero-panel-shell:hover .hero-alert {
          transform: translate(-2px, -6px);
          box-shadow: 0 22px 42px rgba(37, 99, 235, 0.18);
        }

        .step-badge {
          display: inline-flex;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .step-badge-number {
          min-width: 2.3rem;
          height: 2.3rem;
          border-radius: 0.78rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          font-variant-numeric: tabular-nums;
          color: #111827;
          border: 1px solid rgba(148, 163, 184, 0.34);
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.96),
            rgba(248, 250, 252, 0.9)
          );
          box-shadow:
            0 6px 14px rgba(15, 23, 42, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.82);
        }

        .premium-card:hover .step-badge-number {
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow:
            0 8px 18px rgba(37, 99, 235, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .premium-card {
          transition:
            transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 320ms ease,
            border-color 320ms ease;
        }

        .premium-card:hover {
          transform: translateY(-3px);
          border-color: rgba(37, 99, 235, 0.35);
          box-shadow: 0 14px 30px rgba(37, 99, 235, 0.12);
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .hero-panel-shell,
          .live-panel,
          .live-chip,
          .hero-alert,
          .premium-card {
            transform: none;
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
