import Link from "next/link";

function LiveDataPanel() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden text-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <p className="font-semibold text-gray-800 text-xs">Live Data Pipeline</p>
        <p className="text-gray-400 text-xs">All dashboard views load from MongoDB-backed APIs</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            "Attendance",
            "Assessments",
            "Assignments",
            "LMS Activity",
          ].map((source) => (
            <div key={source} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-gray-700">{source}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Fetched in real time</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-800">No hardcoded dashboard records</p>
          <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
            Mentors, students, teachers, and coordinators see records sourced from database APIs,
            with empty/error states shown when data is unavailable.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[11px] font-semibold text-gray-800">Risk scoring flow</p>
          <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
            Risk scores are calculated from attendance, marks, assignment completion, LMS engagement,
            and submission timeliness when an external model is not configured.
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
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">EduShield</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a>
          <a href="#roles" className="hover:text-gray-900 transition-colors">Roles</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Sign In</Link>
          <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition-colors font-medium">
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
                <span className="text-blue-700 text-xs font-medium">Academic Risk Intelligence Platform</span>
              </div>
              <h1 className="text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight tracking-tight mb-4">
                Identify At-Risk Students<br />
                <span className="text-blue-600">Before It&apos;s Too Late</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
                Track attendance, marks, assignments, and LMS engagement in one place.
                Get early risk warnings and take action before students fall behind.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/login" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700 transition-colors text-sm">
                  View Demo Dashboard
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded font-medium hover:bg-gray-50 transition-colors text-sm">
                  Explore How It Works
                </a>
              </div>
              {/* Trust indicators */}
              <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  5-Factor Risk Algorithm
                </div>
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Role-Based Access
                </div>
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated Alerts
                </div>
              </div>
            </div>

            {/* Right - Live Data Overview */}
            <div className="relative lg:pl-4">
              <LiveDataPanel />
              {/* Alert banner floating */}
              <div className="absolute -bottom-4 -left-4 bg-white border border-red-200 rounded-lg px-3 py-2 shadow-md flex items-start gap-2 max-w-xs">
                <span className="text-red-500 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">High-Risk Alert</p>
                  <p className="text-xs text-gray-500 mt-0.5">Mentors are notified when a student enters high risk so intervention can begin immediately.</p>
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
            <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2">The Problem</p>
            <h2 className="text-2xl font-bold text-gray-900">Why Students Slip Through the Cracks</h2>
            <p className="text-gray-500 mt-2 max-w-xl text-sm leading-relaxed">
              By the time faculty notices a student is at risk, they&apos;ve already fallen significantly behind.
              The root cause is always the same — fragmented data and delayed action.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                ),
                title: "Data is scattered",
                desc: "Attendance, marks, and LMS data live in separate systems. No one sees the full picture.",
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "No early warning system",
                desc: "Reports are generated at fixed intervals. Warning signals are invisible between cycles.",
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                ),
                title: "Intervention is too late",
                desc: "By the time counselling is arranged, students have already lost motivation and missed exams.",
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: "Students are unaware",
                desc: "Students don&apos;t know they are at risk until they receive a failing grade. No self-awareness portal exists.",
              },
            ].map((p) => (
              <div key={p.title} className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{p.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">How It Works</p>
            <h2 className="text-2xl font-bold text-gray-900">A Single System That Connects Everything</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connector lines */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gray-200" />
            <div className="hidden md:block absolute top-10 left-2/3 right-0 h-px bg-gray-200" />

            {[
              {
                step: "01",
                title: "Collect Data",
                desc: "Attendance records, internal marks, assignment submissions, and LMS login activity are all aggregated in one place — automatically.",
                tags: ["Attendance", "Marks", "Assignments", "LMS Activity"],
                color: "bg-blue-600",
              },
              {
                step: "02",
                title: "Calculate Risk",
                desc: "A 5-factor weighted algorithm generates an objective Risk Score (0–100) for every student. Recalculated every 24 hours or on new data entry.",
                tags: ["30% Attendance", "25% Marks", "20% Assignments", "15% LMS", "10% Timeliness"],
                color: "bg-orange-500",
              },
              {
                step: "03",
                title: "Take Action",
                desc: "Mentors receive alerts, log interventions, and track improvement. Students see personalized suggestions. Coordinators monitor trends.",
                tags: ["Alerts", "Interventions", "Reports", "Progress Tracking"],
                color: "bg-green-600",
              },
            ].map((step) => (
              <div key={step.step} className="bg-[#F9FAFB] border border-gray-200 rounded-lg p-6 relative">
                <div className={`w-9 h-9 rounded-full ${step.color} text-white text-sm font-bold flex items-center justify-center mb-4`}>
                  {step.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{step.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.tags.map((t) => (
                    <span key={t} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 bg-[#F9FAFB] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Features</p>
            <h2 className="text-2xl font-bold text-gray-900">Everything You Need, Nothing You Don&apos;t</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "📊",
                title: "Faculty Mentor Dashboard",
                desc: "Filterable student table with risk scores, attendance, pending assignments, and quick-action buttons per student.",
              },
              {
                icon: "👤",
                title: "Student Self-View Portal",
                desc: "Students see their own risk score, top contributing factors, and specific, actionable improvement suggestions.",
              },
              {
                icon: "🧮",
                title: "Risk Score + Explanation",
                desc: "Every score includes a plain-English breakdown showing WHY the student is at risk — with current vs. required values.",
              },
              {
                icon: "📝",
                title: "Intervention Logging",
                desc: "Mentors log counselling sessions, remedial classes, and study plans against specific students with outcome tracking.",
              },
              {
                icon: "📈",
                title: "Pre / Post Comparison",
                desc: "Automatically compare a student's academic metrics before and after an intervention to measure real impact.",
              },
              {
                icon: "🔔",
                title: "Automated Alert System",
                desc: "Mentors are notified when risk crosses thresholds, attendance drops, or follow-up dates are approaching.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ────────────────────────────────────────────────────────────── */}
      <section id="roles" className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">User Roles</p>
            <h2 className="text-2xl font-bold text-gray-900">Built for Every Person in the Academic Chain</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                role: "Student",
                color: "border-t-blue-500",
                icon: "🎓",
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
                icon: "👨‍🏫",
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
                icon: "📚",
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
                icon: "🏛️",
                capabilities: [
                  "View institution-level analytics",
                  "Monitor intervention effectiveness",
                  "Identify systemic risk patterns",
                  "Manage all user accounts",
                  "Download comprehensive reports",
                ],
              },
            ].map((r) => (
              <div key={r.role} className={`bg-[#F9FAFB] border border-gray-200 border-t-4 ${r.color} rounded-lg p-5`}>
                <div className="text-2xl mb-2">{r.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">{r.role}</h3>
                <ul className="space-y-2">
                  {r.capabilities.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
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
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2">Impact</p>
            <h2 className="text-2xl font-bold text-white">From Reactive to Proactive Academic Support</h2>
            <p className="text-gray-400 mt-2 text-sm max-w-xl">
              Institutions that detect academic risk early consistently see better outcomes — for students and faculty alike.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-700 rounded-lg overflow-hidden">
            {[
              { value: "3–4 wks", label: "Earlier identification of struggling students", icon: "⏰" },
              { value: "↓ 40%",   label: "Reduction in undetected at-risk cases",         icon: "📉" },
              { value: "100%",    label: "Intervention actions tracked and auditable",      icon: "✅" },
              { value: "2×",      label: "Faster faculty response to high-risk cases",      icon: "⚡" },
            ].map((s) => (
              <div key={s.label} className="bg-[#1E293B] px-6 py-8">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-3xl font-bold text-white mb-2">{s.value}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{s.label}</p>
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
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Explainable Insights</p>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Not Just a Score — An Explanation</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Every risk score comes with a plain-English breakdown. Faculty and students always know <em>why</em> the score is what it is,
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {i}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sample Risk Card */}
            <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl overflow-hidden">
              {/* Risk header */}
              <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Arjun Mehta</p>
                  <p className="text-xs text-gray-500">CE2301 · Batch CE-A · Semester 3</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">68</div>
                  <div className="text-xs text-red-600 font-medium">HIGH RISK</div>
                </div>
              </div>
              {/* Risk factors */}
              <div className="p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Contributing Factors</p>
                {[
                  { rank: 1, reason: "Low Attendance", current: "52%", required: "75%", contrib: "38%", bad: true },
                  { rank: 2, reason: "Missing Assignments", current: "3 of 8 submitted", required: "All 8", contrib: "27%", bad: true },
                  { rank: 3, reason: "Low Assessment Marks", current: "18/50 in Unit 2", required: "20+/50", contrib: "21%", bad: true },
                  { rank: 4, reason: "Low LMS Activity", current: "1 login/week", required: "3/week", contrib: "14%", bad: true },
                ].map((f) => (
                  <div key={f.rank} className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">#{f.rank}</span>
                        <span className="text-xs font-semibold text-gray-800">{f.reason}</span>
                      </div>
                      <span className="text-xs text-orange-600 font-semibold">{f.contrib} of risk</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="text-red-600 font-medium">{f.current}</span>
                      <span>→ required:</span>
                      <span className="font-medium text-gray-700">{f.required}</span>
                    </div>
                  </div>
                ))}
                {/* Suggestion */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">💡 Suggested Action</p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Attend at least 5 more classes this month and submit 5 pending assignments
                    to reduce risk score below the High threshold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-[#F9FAFB] border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Don&apos;t wait until results are out to act.
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Academic risk is detectable weeks before exams — if you have the right data. EduShield gives you that visibility today.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login" className="bg-blue-600 text-white px-6 py-2.5 rounded font-medium hover:bg-blue-700 transition-colors text-sm">
              View Demo
            </Link>
            <Link href="/signup" className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded font-medium hover:bg-white transition-colors text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0F172A] py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-semibold text-white text-sm">EduShield</span>
              </div>
              <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                Early Academic Risk Detection &amp; Student Intervention Platform.
                Built for universities that care about outcomes.
              </p>
            </div>
            <div className="flex gap-6 text-xs text-gray-500">
              <a href="#" className="hover:text-gray-300 transition-colors">About</a>
              <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-gray-300 transition-colors">How It Works</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-600">
            © 2026 EduShield · Early Academic Risk Detection &amp; Student Intervention Platform · Dev IT Limited
          </div>
        </div>
      </footer>
    </div>
  );
}
