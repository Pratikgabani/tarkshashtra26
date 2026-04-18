"use client";

import { useState } from "react";
import Link from "next/link";

type UserRole = "student" | "mentor" | "teacher" | "coordinator";

interface FormState {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | "";
  department: string;
  studentId: string;
  semester: string;
  batch: string;
}

const DEPARTMENTS = [
  "Computer Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Electronics & Communication",
  "Information Technology",
];

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "student", label: "Student", description: "View your academic risk score and improvement suggestions" },
  { value: "mentor", label: "Faculty Mentor", description: "Monitor mentees and log interventions" },
  { value: "teacher", label: "Subject Teacher", description: "Upload marks and manage assignments" },
  { value: "coordinator", label: "Academic Coordinator", description: "Oversee institution-level analytics" },
];

export default function SignupPage() {
  const [form, setForm] = useState<FormState>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    department: "",
    studentId: "",
    semester: "",
    batch: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep1 = (): boolean => {
    if (!form.role) {
      setError("Please select a role to continue");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!form.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (!form.password) {
      setError("Password is required");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!form.department) {
      setError("Please select a department");
      return false;
    }
    if (form.role === "student" && !form.studentId.trim()) {
      setError("Student ID is required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
      setError("");
    }
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.toLowerCase().trim(),
          password: form.password,
          role: form.role,
          department: form.department,
          ...(form.role === "student" && {
            studentId: form.studentId.trim(),
            semester: form.semester ? Number(form.semester) : undefined,
            batch: form.batch.trim() || undefined,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Success screen ---
  if (success) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Account Created</h1>
          <p className="mt-2 text-text-secondary">
            Your account has been created successfully. You can now sign in.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-text-primary">EduShield</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary">Create your account</h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Join the Academic Risk Detection Platform
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center gap-3 px-1">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${step >= 1 ? "bg-primary text-white" : "bg-border text-text-secondary"}`}>
              1
            </div>
            <span className={`text-sm font-medium ${step >= 1 ? "text-text-primary" : "text-text-secondary"}`}>
              Select Role
            </span>
          </div>
          <div className={`h-px flex-1 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${step >= 2 ? "bg-primary text-white" : "bg-border text-text-secondary"}`}>
              2
            </div>
            <span className={`text-sm font-medium ${step >= 2 ? "text-text-primary" : "text-text-secondary"}`}>
              Your Details
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-error" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Step 1 — Role Selection */}
        {step === 1 && (
          <div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => updateField("role", r.value)}
                  className={`group rounded-lg border-2 p-4 text-left transition-all ${
                    form.role === r.value
                      ? "border-primary bg-blue-50/60"
                      : "border-border bg-surface hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${form.role === r.value ? "text-primary" : "text-text-primary"}`}>
                      {r.label}
                    </span>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                      form.role === r.value ? "border-primary bg-primary" : "border-gray-300"
                    }`}>
                      {form.role === r.value && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{r.description}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              disabled={!form.role}
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — Details Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-text-primary">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                placeholder="Enter your full name"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-primary">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@institution.edu"
                className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Min. 6 characters"
                  className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-text-primary">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-text-primary">
                Department
              </label>
              <select
                id="department"
                value={form.department}
                onChange={(e) => updateField("department", e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Student-specific fields */}
            {form.role === "student" && (
              <div className="rounded-lg border border-border bg-gray-50/50 p-4 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
                  Student Information
                </p>
                <div>
                  <label htmlFor="studentId" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Student ID <span className="text-error">*</span>
                  </label>
                  <input
                    id="studentId"
                    type="text"
                    value={form.studentId}
                    onChange={(e) => updateField("studentId", e.target.value)}
                    placeholder="e.g. 22CE001"
                    className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="semester" className="mb-1.5 block text-sm font-medium text-text-primary">
                      Semester
                    </label>
                    <select
                      id="semester"
                      value={form.semester}
                      onChange={(e) => updateField("semester", e.target.value)}
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                    >
                      <option value="">Select</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="batch" className="mb-1.5 block text-sm font-medium text-text-primary">
                      Batch
                    </label>
                    <input
                      id="batch"
                      type="text"
                      value={form.batch}
                      onChange={(e) => updateField("batch", e.target.value)}
                      placeholder="e.g. CE-A"
                      className="h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm text-text-primary placeholder:text-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
