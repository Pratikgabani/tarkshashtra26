"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  LineChart,
  FileText,
  Settings,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coordinator/analytics", label: "Analytics", icon: LineChart },
  {
    href: "/coordinator/students",
    label: "Student Monitoring",
    icon: ShieldAlert,
  },
  {
    href: "/coordinator/interventions",
    label: "Interventions",
    icon: Settings,
  },
  { href: "/coordinator/reports", label: "Reports", icon: FileText },
  { href: "/coordinator/users", label: "User Management", icon: Users },
];

export default function CoordinatorSidebar() {
  const pathname = usePathname();
  const [coordinatorProfile, setCoordinatorProfile] = useState({
    name: "Coordinator",
    meta: "Coordinator",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = localStorage.getItem("shikshasetu_user");
        if (!raw) return;

        const parsed = JSON.parse(raw) as {
          fullName?: string;
          role?: string;
          department?: string;
        };

        if (parsed.role !== "coordinator") return;

        const fullName = parsed.fullName?.trim() || "Coordinator";
        const department = parsed.department?.trim();

        setCoordinatorProfile({
          name: fullName,
          meta: department ? `${department} Coordinator` : "Coordinator",
        });
      } catch {
        // Keep fallback values when local session data is unavailable.
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const coordinatorName = coordinatorProfile.name;
  const coordinatorMeta = coordinatorProfile.meta;

  const initials = useMemo(() => {
    const parts = coordinatorName
      .split(" ")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) return "CO";
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [coordinatorName]);

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
          <p className="text-[15px] font-bold text-[#0F172A] tracking-tight leading-tight">
            ShikshaSetu
          </p>
          <p className="text-[11px] text-[#64748B] font-semibold leading-tight uppercase tracking-widest">
            Coordinator
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
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                isActive
                  ? "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                  : "border-transparent text-[#64748B] hover:border-[#E2E8F0] hover:bg-white hover:text-[#0F172A]"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 ${
                  isActive
                    ? "text-[#1D4ED8]"
                    : "text-[#64748B] group-hover:text-[#334155]"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-[#E2E8F0] shrink-0 bg-[#F8FAFC]/90">
        <div className="flex items-center gap-3 mb-3 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5">
          <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0 border border-[#BFDBFE]">
            <span className="text-sm font-bold text-[#1D4ED8]">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0F172A] truncate">
              {coordinatorName}
            </p>
            <p className="text-xs text-[#64748B] truncate font-medium">
              {coordinatorMeta}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center w-full py-2 rounded-xl text-xs font-semibold text-[#475569] hover:bg-white hover:text-[#0F172A] border border-[#E2E8F0] hover:shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
