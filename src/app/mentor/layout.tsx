import MentorSidebar from '@/src/components/mentor/MentorSidebar';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Mentor Portal — ShikshaSetu',
  description: 'Faculty Mentor dashboard for academic risk monitoring and student intervention.',
};

export default function MentorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <MentorSidebar />
      <div className="app-main-with-sidebar">
        {children}
      </div>
    </div>
  );
}
