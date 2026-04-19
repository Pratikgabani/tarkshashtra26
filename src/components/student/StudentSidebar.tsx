"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchStudentDashboardData } from "@/src/lib/studentDashboardClient";
import {
  LayoutDashboard,
  GraduationCap,
  LineChart,
  Bell,
  User,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/subjects", label: "Subjects", icon: GraduationCap },
  { href: "/student/analytics", label: "Analytics", icon: LineChart },
  { href: "/student/alerts", label: "Alerts", icon: Bell },
  { href: "/student/profile", label: "Profile", icon: User },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const [studentName, setStudentName] = useState("Student");
  const [studentId, setStudentId] = useState("");
  const [batch, setBatch] = useState("");
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    async function loadSidebarData() {
      const result = await fetchStudentDashboardData();
      if (!result.ok) return;

      setStudentName(result.data.student.fullName || "Student");
      setStudentId(result.data.student.studentId || "");
      setBatch(result.data.student.batch || "");
      setUnreadAlerts(
        typeof result.data.unreadAlertCount === "number"
          ? result.data.unreadAlertCount
          : result.data.alerts.filter((alert) => alert.status === "unread")
              .length,
      );
    }

    void loadSidebarData();
  }, []);

  const initials = useMemo(
    () =>
      studentName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [studentName],
  );

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
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#0F172A] leading-tight tracking-tight">
            ShikshaSetu
          </p>
          <p className="text-[11px] text-[#64748B] font-semibold leading-tight uppercase tracking-[0.18em]">
            Student
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.22em] px-3 mb-2">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "border-transparent text-[#64748B] hover:border-[#E2E8F0] hover:bg-white hover:text-[#0F172A]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive
                    ? "text-[#1D4ED8]"
                    : "text-[#64748B] group-hover:text-[#334155]"
                }`}
              />
              {item.label}
              {item.label === "Alerts" && unreadAlerts > 0 && (
                <span className="ml-auto bg-[#FEE2E2] text-[#DC2626] text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#FECACA]">
                  {unreadAlerts}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Student Profile Footer */}
      <div className="p-4 border-t border-[#E2E8F0] shrink-0 bg-[#F8FAFC]/90">
        <div className="flex items-center gap-3 mb-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5">
          <div className="w-9 h-9 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-[#1D4ED8]">
              {initials || "ST"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] truncate">
              {studentName}
            </p>
            <p className="text-[11px] text-[#64748B] truncate">
              {studentId}
              {batch ? ` • ${batch}` : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold text-[#475569] border border-[#E2E8F0] hover:bg-white hover:text-[#0F172A] transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
