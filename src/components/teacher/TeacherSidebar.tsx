"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface StoredUser {
  id?: string;
  fullName?: string;
  role?: string;
  department?: string;
}

const NAV = [
  {
    href: "/teacher/dashboard",
    label: "Dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    href: "/teacher/marks",
    label: "Marks Entry",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    href: "/teacher/attendance",
    label: "Attendance",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10m-10 4h6m5 6H6a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    href: "/teacher/assignments",
    label: "Assignments",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    href: "/teacher/analytics",
    label: "Analytics",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
];

function getStoredTeacher(): { fullName: string; department: string } | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("shikshasetu_user");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredUser;
    if (parsed.role !== "teacher") {
      return null;
    }

    return {
      fullName: parsed.fullName || "Teacher",
      department: parsed.department || "Department",
    };
  } catch {
    return null;
  }
}

export default function TeacherSidebar() {
  const pathname = usePathname();
  const [teacher, setTeacher] = useState<{
    fullName: string;
    department: string;
  } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTeacher(getStoredTeacher());
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const teacherName = teacher?.fullName || "Teacher";
  const teacherDepartment = teacher?.department || "Department";
  const teacherInitials = teacherName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort logout: still clear client-side session state.
    } finally {
      localStorage.removeItem("shikshasetu_user");
      window.location.href = "/login";
    }
  };

  return (
    <aside className="app-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-18 border-b border-[#E2E8F0] shrink-0 bg-white/80">
        <div className="w-9 h-9 rounded-xl bg-[#1D4ED8] flex items-center justify-center shrink-0 shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4.5 w-4.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#0F172A] leading-tight tracking-tight">
            ShikshaSetu
          </p>
          <p className="text-[11px] text-[#64748B] leading-tight font-semibold uppercase tracking-[0.18em]">Teacher</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-[0.22em] px-3 mb-2">
          Menu
        </p>
        {NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                isActive
                  ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "border-transparent text-[#64748B] hover:border-[#E2E8F0] hover:bg-white hover:text-[#0F172A]"
              }`}
            >
              <span className={isActive ? "text-[#1D4ED8]" : "text-[#64748B] group-hover:text-[#334155]"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Teacher profile */}
      <div className="px-4 py-4 border-t border-[#E2E8F0] shrink-0 bg-[#F8FAFC]/90">
        <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 mb-2">
          <div className="w-9 h-9 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
            <span className="text-xs font-bold text-[#1D4ED8]">
              {teacherInitials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0F172A] truncate">
              {teacherName}
            </p>
            <p className="text-xs text-[#64748B] truncate">
              {teacherDepartment}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-white hover:text-[#0F172A] transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
