import type { ReactNode } from 'react';
import StudentSidebar from '@/src/components/student/StudentSidebar';

export const metadata = {
  title: 'Student Portal — EduShield',
  description: 'Student Performance Dashboard and Analytics',
};

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <StudentSidebar />
      <div className="ml-60 flex-1 flex flex-col min-h-screen max-w-full">
        {children}
      </div>
    </div>
  );
}
