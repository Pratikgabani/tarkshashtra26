'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STUDENT_INFO } from '@/src/lib/studentData';
import { LayoutDashboard, GraduationCap, LineChart, Bell, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/subjects', label: 'Subjects', icon: GraduationCap },
  { href: '/student/analytics', label: 'Analytics', icon: LineChart },
  { href: '/student/alerts', label: 'Alerts', icon: Bell },
  { href: '/student/profile', label: 'Profile', icon: User },
];

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-100 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-tight tracking-tight">EduShield</p>
          <p className="text-[11px] text-gray-500 font-medium leading-tight">Student Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Menu</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.label}
              {item.label === 'Alerts' && (
                <span className="ml-auto bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  2
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Student Profile Footer */}
      <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-sm flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {STUDENT_INFO.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{STUDENT_INFO.name}</p>
            <p className="text-[11px] text-gray-500 truncate">{STUDENT_INFO.id} • {STUDENT_INFO.batch}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-1.5 rounded-md text-xs font-medium text-gray-500 hover:bg-white hover:text-gray-800 hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-200"
        >
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
