import TeacherSidebar from "@/src/components/teacher/TeacherSidebar";
import type { ReactNode } from "react";

export const metadata = {
  title: "Teacher Portal — ShikshaSetu",
  description:
    "Subject Teacher Module: Marks entry, assignment management, and performance analytics.",
};

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <TeacherSidebar />
      <div className="app-main-with-sidebar">{children}</div>
    </div>
  );
}
