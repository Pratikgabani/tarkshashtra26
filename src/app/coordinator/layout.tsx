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
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans">
      <CoordinatorSidebar />
      <div className="ml-64 flex-1 flex flex-col min-h-screen w-full">
        {children}
      </div>
    </div>
  );
}
