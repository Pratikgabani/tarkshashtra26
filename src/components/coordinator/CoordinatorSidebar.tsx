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
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[#E5E7EB] flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[#E5E7EB] shrink-0 bg-[#F9FAFB]/50">
        <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-[#111827] tracking-tight leading-tight">
            ShikshaSetu
          </p>
          <p className="text-[11px] text-[#6B7280] font-medium leading-tight uppercase tracking-wider">
            Coordinator
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest px-2 mb-3">
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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-[#2563EB] shadow-sm"
                  : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 ${isActive ? "text-[#2563EB]" : "text-[#6B7280]"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="p-5 border-t border-[#E5E7EB] shrink-0 bg-[#F9FAFB]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#2563EB] to-blue-400 flex items-center justify-center shrink-0 shadow-sm border border-blue-600">
            <span className="text-sm font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#111827] truncate">
              {coordinatorName}
            </p>
            <p className="text-xs text-[#6B7280] truncate font-medium">
              {coordinatorMeta}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center justify-center w-full py-2 rounded-lg text-xs font-semibold text-[#6B7280] hover:bg-white hover:text-[#111827] border border-[#E5E7EB] hover:shadow-sm transition-all duration-200"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
