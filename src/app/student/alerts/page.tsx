'use client';

import { useState } from 'react';
import { ALERTS } from '@/src/lib/studentData';
import { AlertTriangle, Calendar, FileText, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
        Mark all as read
      </button>
    </div>
  );
}

export default function AlertsPage() {
  const [filter, setFilter] = useState('All');

  const filteredAlerts = filter === 'All' ? ALERTS : ALERTS.filter(a => a.priority === filter);

  const getPriorityInfo = (priority: string) => {
    switch(priority) {
      case 'Critical': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'High': return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'Medium': return { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'Low': return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
      default: return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' };
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#F8FAFC]">
      <Topbar title="Notifications & Alerts" subtitle="Stay updated on important events, risks, and messages" />

      <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
        
        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 border-b border-gray-200 pb-4">
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-20">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-gray-900">All Caught Up</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">You don't have any {filter.toLowerCase()} notifications.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const { icon: Icon, color, bg, border } = getPriorityInfo(alert.priority);
              return (
                <div 
                  key={alert.id} 
                  className={`bg-white rounded-xl border p-5 flex gap-4 transition-all shadow-sm ${
                    alert.isRead ? 'border-gray-200 opacity-75' : 'border-blue-200 ring-1 ring-blue-500/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border ${bg} ${border}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        {!alert.isRead && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        <h3 className={`text-sm font-bold text-gray-900 ${!alert.isRead && 'text-gray-900'}`}>{alert.title}</h3>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-4">{alert.dateTime}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{alert.message}</p>
                    
                    <div className="mt-4 flex items-center gap-3">
                      <Link href="/student/profile" className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-2 rounded-md">
                        Take Action
                      </Link>
                      <button className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1.5 transition-colors">
                        {alert.isRead ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Circle className="w-3.5 h-3.5"/>}
                        {alert.isRead ? 'Mark as unread' : 'Mark as read'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>
    </div>
  );
}
