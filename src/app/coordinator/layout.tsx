import type { ReactNode } from "react";
import CoordinatorSidebar from "@/src/components/coordinator/CoordinatorSidebar";

export const metadata = {
  title: "Coordinator Portal — ShikshaSetu",
  description: "Academic Coordinator Dashboard & Student Risk Analytics",
};

export default function CoordinatorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="app-shell font-sans">
      <CoordinatorSidebar />
      <div className="coordinator-layout-main app-main-with-sidebar">
        {children}
      </div>
    </div>
  );
}
