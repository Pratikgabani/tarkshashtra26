import TeacherSidebar from "@/src/components/teacher/TeacherSidebar";
import type { ReactNode } from "react";

export const metadata = {
  title: "Teacher Portal — ShikshaSetu",
  description:
    "Subject Teacher Module: Marks entry, assignment management, and performance analytics.",
};

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <TeacherSidebar />
      {/* offset for fixed sidebar */}
      <div className="ml-56 flex-1 flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
