import MentorSidebar from '@/src/components/mentor/MentorSidebar';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Mentor Portal — ShikshaSetu',
  description: 'Faculty Mentor dashboard for academic risk monitoring and student intervention.',
};

export default function MentorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <MentorSidebar />
      <div className="ml-56 flex-1 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
