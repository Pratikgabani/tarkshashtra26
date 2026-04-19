import type { ReactNode } from "react";
import StudentSidebar from "@/src/components/student/StudentSidebar";

export const metadata = {
  title: "Student Portal — ShikshaSetu",
  description: "Student Performance Dashboard and Analytics",
};

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <StudentSidebar />
      <div className="app-main-with-sidebar">
        {children}
      </div>
    </div>
  );
}
